const { PermissionFlagsBits } = require('discord.js');
const { User } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');
const ms = require('ms');

module.exports = {
    name: 'timeout',
    description: 'Timeout a user',
    usage: '!timeout <@user> <duration> [reason]',
    category: 'moderation',
    userPermissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need the Timeout Members permission to use this command.')] });
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please mention a user or provide a user ID to timeout.')] });
        }
        
        if (!args[1]) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please provide a duration (e.g., 10m, 2h, 1d, 1w).')] });
        }
        
        // Parse duration
        const duration = ms(args[1]);
        if (!duration || duration < 1000 || duration > 2419200000) { // Max 28 days
            return message.reply({ embeds: [embedBuilder.error('Invalid Duration', 'Please provide a valid duration between 1 second and 28 days.')] });
        }
        
        // Check if target can be timed out
        if (!target.moderatable) {
            return message.reply({ embeds: [embedBuilder.error('Cannot Timeout', 'I cannot timeout this user. They may have a higher role than me.')] });
        }
        
        // Check hierarchy
        if (!hasOwnerBypass && target.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply({ embeds: [embedBuilder.error('Cannot Timeout', 'You cannot timeout someone with an equal or higher role.')] });
        }
        
        // Get reason
        const reason = args.slice(2).join(' ') || 'No reason provided';
        
        try {
            // Apply timeout
            await target.timeout(duration, `${reason} - Timed out by ${message.author.tag}`);
            
            // Log to database
            await User.findOneAndUpdate(
                { userId: target.id, guildId: message.guild.id },
                { 
                    $push: { 
                        infractions: {
                            type: 'timeout',
                            reason,
                            moderator: message.author.id,
                            duration: args[1],
                            timestamp: new Date()
                        }
                    }
                },
                { upsert: true }
            );
            
            // Send success message
            const successEmbed = embedBuilder.success(
                'User Timed Out',
                `${target.user.tag} has been timed out for ${args[1]}.\n**Reason:** ${reason}`
            );
            message.reply({ embeds: [successEmbed] });
            
            // DM the user
            const dmEmbed = embedBuilder.warning(
                'Timed Out',
                `You have been timed out in **${message.guild.name}** for ${args[1]}\n**Reason:** ${reason}`,
                `Timed out by ${message.author.tag}`
            );
            
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            // Log to mod channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
            if (logChannel) {
                const logEmbed = embedBuilder.modLog('User Timed Out', message.author, target.user, reason, args[1]);
                logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Timeout error:', error);
            message.reply({ embeds: [embedBuilder.error('Timeout Failed', 'An error occurred while trying to timeout the user.')] });
        }
    }
};