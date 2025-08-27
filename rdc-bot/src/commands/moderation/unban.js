const { PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'unban',
    description: 'Unban a user from the server',
    usage: '!unban <userID>',
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
        
        if (!args[0]) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please provide a user ID to unban.')] });
        }
        
        const userId = args[0];
        
        try {
            // Fetch ban
            const ban = await message.guild.bans.fetch(userId).catch(() => null);
            
            if (!ban) {
                return message.reply({ embeds: [embedBuilder.error('User Not Banned', 'This user is not banned from the server.')] });
            }
            
            // Unban the user
            await message.guild.members.unban(userId, `Unbanned by ${message.author.tag}`);
            
            // Send success message
            const successEmbed = embedBuilder.success(
                'User Unbanned',
                `User ${ban.user.tag} (${userId}) has been unbanned from the server.`
            );
            message.reply({ embeds: [successEmbed] });
            
            // Log to mod channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
            if (logChannel) {
                const logEmbed = embedBuilder.modLog('User Unbanned', message.author, ban.user, 'Manual unban');
                logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Unban error:', error);
            message.reply({ embeds: [embedBuilder.error('Unban Failed', 'An error occurred while trying to unban the user.')] });
        }
    }
};