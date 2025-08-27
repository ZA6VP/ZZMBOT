const { PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'unlock',
    description: 'Unlock a previously locked channel',
    usage: '!unlock [channel]',
    category: 'admin',
    userPermissions: ['ManageChannels'],
    botPermissions: ['ManageChannels'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need the Manage Channels permission to use this command.')] });
        }
        
        // Get channel (default to current channel)
        const channel = message.mentions.channels.first() || message.channel;
        
        try {
            // Check if channel is actually locked
            const everyoneRole = message.guild.roles.everyone;
            const currentPerms = channel.permissionsFor(everyoneRole);
            
            if (currentPerms && currentPerms.has(PermissionFlagsBits.SendMessages)) {
                return message.reply({ embeds: [embedBuilder.error('Not Locked', 'This channel is not locked.')] });
            }
            
            // Unlock the channel
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null,
                AddReactions: null
            }, { reason: `Unlocked by ${message.author.tag}` });
            
            // Send confirmation
            const unlockEmbed = embedBuilder.success(
                'Channel Unlocked',
                `This channel has been unlocked by ${message.author.tag}`
            );
            
            await channel.send({ embeds: [unlockEmbed] });
            
            if (channel.id !== message.channel.id) {
                message.reply({ embeds: [embedBuilder.success('Channel Unlocked', `Successfully unlocked ${channel}.`)] });
            }
            
            // Log to mod channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
            if (logChannel && logChannel.id !== channel.id) {
                const logEmbed = {
                    color: 0x00ff00,
                    title: '🔓 Channel Unlocked',
                    fields: [
                        { name: 'Channel', value: `${channel} (${channel.name})`, inline: true },
                        { name: 'Moderator', value: `${message.author.tag}`, inline: true }
                    ],
                    timestamp: new Date()
                };
                logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Unlock error:', error);
            message.reply({ embeds: [embedBuilder.error('Unlock Failed', 'An error occurred while trying to unlock the channel.')] });
        }
    }
};