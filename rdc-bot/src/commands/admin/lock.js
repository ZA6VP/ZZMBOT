const { PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'lock',
    description: 'Lock a channel to prevent users from sending messages',
    usage: '!lock [channel] [reason]',
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
        const reason = args.join(' ') || 'No reason provided';
        
        try {
            // Check if channel is already locked
            const everyoneRole = message.guild.roles.everyone;
            const currentPerms = channel.permissionsFor(everyoneRole);
            
            if (currentPerms && !currentPerms.has(PermissionFlagsBits.SendMessages)) {
                return message.reply({ embeds: [embedBuilder.error('Already Locked', 'This channel is already locked.')] });
            }
            
            // Lock the channel
            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false,
                AddReactions: false
            }, { reason: `Locked by ${message.author.tag}: ${reason}` });
            
            // Send confirmation
            const lockEmbed = embedBuilder.warning(
                'Channel Locked',
                `This channel has been locked by ${message.author.tag}\n**Reason:** ${reason}`
            );
            
            await channel.send({ embeds: [lockEmbed] });
            
            if (channel.id !== message.channel.id) {
                message.reply({ embeds: [embedBuilder.success('Channel Locked', `Successfully locked ${channel}.`)] });
            }
            
            // Log to mod channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
            if (logChannel && logChannel.id !== channel.id) {
                const logEmbed = {
                    color: 0xff9900,
                    title: '🔒 Channel Locked',
                    fields: [
                        { name: 'Channel', value: `${channel} (${channel.name})`, inline: true },
                        { name: 'Moderator', value: `${message.author.tag}`, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    ],
                    timestamp: new Date()
                };
                logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Lock error:', error);
            message.reply({ embeds: [embedBuilder.error('Lock Failed', 'An error occurred while trying to lock the channel.')] });
        }
    }
};