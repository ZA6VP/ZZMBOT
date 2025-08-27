const { PermissionFlagsBits } = require('discord.js');
const { Guild } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'logschannel',
    aliases: ['setlogs', 'modlogs'],
    description: 'Set the channel for mod logs',
    usage: '!logschannel <#channel>',
    category: 'admin',
    userPermissions: ['Administrator'],
    botPermissions: ['SendMessages', 'EmbedLinks'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need Administrator permission to use this command.')] });
        }
        
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        
        if (!channel) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please mention a channel or provide a channel ID.')] });
        }
        
        if (channel.type !== 0) { // 0 = GUILD_TEXT
            return message.reply({ embeds: [embedBuilder.error('Invalid Channel', 'Please select a text channel.')] });
        }
        
        // Check bot permissions in the channel
        const botPerms = channel.permissionsFor(message.guild.members.me);
        if (!botPerms.has(PermissionFlagsBits.SendMessages) || !botPerms.has(PermissionFlagsBits.EmbedLinks)) {
            return message.reply({ embeds: [embedBuilder.error('Missing Permissions', 'I need Send Messages and Embed Links permissions in that channel.')] });
        }
        
        try {
            // Update guild settings
            await Guild.findOneAndUpdate(
                { guildId: message.guild.id },
                { logChannel: channel.id },
                { upsert: true }
            );
            
            // Update config
            client.config.logChannel = channel.name;
            
            const successEmbed = embedBuilder.success(
                'Logs Channel Set',
                `Mod logs will now be sent to ${channel}`
            );
            message.reply({ embeds: [successEmbed] });
            
            // Send test message to the logs channel
            const testEmbed = {
                color: 0x00ff00,
                title: '✅ Logs Channel Configured',
                description: 'This channel has been set as the mod logs channel.',
                fields: [
                    { name: 'Configured By', value: message.author.tag, inline: true },
                    { name: 'Server', value: message.guild.name, inline: true }
                ],
                timestamp: new Date()
            };
            channel.send({ embeds: [testEmbed] });
            
        } catch (error) {
            console.error('Set logs channel error:', error);
            message.reply({ embeds: [embedBuilder.error('Failed', 'An error occurred while setting the logs channel.')] });
        }
    }
};