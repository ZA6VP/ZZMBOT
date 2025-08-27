const { PermissionFlagsBits } = require('discord.js');
const { User } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'ban',
    description: 'Ban a user from the server',
    usage: '!ban <@user> [reason]',
    category: 'moderation',
    userPermissions: ['BanMembers'],
    botPermissions: ['BanMembers'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need the Ban Members permission to use this command.')] });
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please mention a user or provide a user ID to ban.')] });
        }
        
        // Check if target is bannable
        if (!target.bannable) {
            return message.reply({ embeds: [embedBuilder.error('Cannot Ban', 'I cannot ban this user. They may have a higher role than me.')] });
        }
        
        // Check hierarchy
        if (!hasOwnerBypass && target.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply({ embeds: [embedBuilder.error('Cannot Ban', 'You cannot ban someone with an equal or higher role.')] });
        }
        
        // Get reason
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            // DM the user before banning
            const dmEmbed = embedBuilder.error(
                'Banned',
                `You have been permanently banned from **${message.guild.name}**\n**Reason:** ${reason}`,
                `Banned by ${message.author.tag}`
            );
            
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            // Ban the user
            await target.ban({ reason: `${reason} - Banned by ${message.author.tag}` });
            
            // Log to database
            await User.findOneAndUpdate(
                { userId: target.id, guildId: message.guild.id },
                { 
                    $push: { 
                        infractions: {
                            type: 'ban',
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
                'User Banned',
                `${target.user.tag} has been banned from the server.\n**Reason:** ${reason}`
            );
            message.reply({ embeds: [successEmbed] });
            
            // Log to mod channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
            if (logChannel) {
                const logEmbed = embedBuilder.modLog('User Banned', message.author, target.user, reason);
                logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Ban error:', error);
            message.reply({ embeds: [embedBuilder.error('Ban Failed', 'An error occurred while trying to ban the user.')] });
        }
    }
};