const { PermissionFlagsBits } = require('discord.js');
const { User } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'kick',
    description: 'Kick a user from the server',
    usage: '!kick <@user> [reason]',
    category: 'moderation',
    userPermissions: ['KickMembers'],
    botPermissions: ['KickMembers'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need the Kick Members permission to use this command.')] });
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please mention a user or provide a user ID to kick.')] });
        }
        
        // Check if target is kickable
        if (!target.kickable) {
            return message.reply({ embeds: [embedBuilder.error('Cannot Kick', 'I cannot kick this user. They may have a higher role than me.')] });
        }
        
        // Check hierarchy
        if (!hasOwnerBypass && target.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply({ embeds: [embedBuilder.error('Cannot Kick', 'You cannot kick someone with an equal or higher role.')] });
        }
        
        // Get reason
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            // DM the user before kicking
            const dmEmbed = embedBuilder.warning(
                'Kicked',
                `You have been kicked from **${message.guild.name}**\n**Reason:** ${reason}`,
                `Kicked by ${message.author.tag}`
            );
            
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            // Kick the user
            await target.kick(`${reason} - Kicked by ${message.author.tag}`);
            
            // Log to database
            await User.findOneAndUpdate(
                { userId: target.id, guildId: message.guild.id },
                { 
                    $push: { 
                        infractions: {
                            type: 'kick',
                            reason,
                            moderator: message.author.id,
                            timestamp: new Date()
                        }
                    }
                },
                { upsert: true }
            );
            
            // Send success message
            const successEmbed = embedBuilder.success(
                'User Kicked',
                `${target.user.tag} has been kicked from the server.\n**Reason:** ${reason}`
            );
            message.reply({ embeds: [successEmbed] });
            
            // Log to mod channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
            if (logChannel) {
                const logEmbed = embedBuilder.modLog('User Kicked', message.author, target.user, reason);
                logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Kick error:', error);
            message.reply({ embeds: [embedBuilder.error('Kick Failed', 'An error occurred while trying to kick the user.')] });
        }
    }
};