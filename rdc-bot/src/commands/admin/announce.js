const { PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'announce',
    aliases: ['announcement'],
    description: 'Send an embed announcement to a channel',
    usage: '!announce <#channel> <message>',
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
        
        const channel = message.mentions.channels.first();
        
        if (!channel) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please mention a channel to send the announcement to.')] });
        }
        
        const announcement = args.slice(1).join(' ');
        
        if (!announcement) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please provide a message for the announcement.')] });
        }
        
        // Check bot permissions in target channel
        const botPerms = channel.permissionsFor(message.guild.members.me);
        if (!botPerms.has(PermissionFlagsBits.SendMessages) || !botPerms.has(PermissionFlagsBits.EmbedLinks)) {
            return message.reply({ embeds: [embedBuilder.error('Missing Permissions', 'I need Send Messages and Embed Links permissions in that channel.')] });
        }
        
        try {
            // Create announcement embed
            const announcementEmbed = {
                color: 0x0099ff,
                title: '📢 Announcement',
                description: announcement,
                timestamp: new Date(),
                footer: { 
                    text: `Announced by ${message.author.tag}`,
                    icon_url: message.author.displayAvatarURL({ dynamic: true })
                }
            };
            
            // Add server icon if available
            if (message.guild.iconURL()) {
                announcementEmbed.thumbnail = { url: message.guild.iconURL({ dynamic: true }) };
            }
            
            // Send announcement
            await channel.send({ embeds: [announcementEmbed] });
            
            // Confirm in original channel
            message.reply({ embeds: [embedBuilder.success('Announcement Sent', `Your announcement has been sent to ${channel}.`)] });
            
        } catch (error) {
            console.error('Announce error:', error);
            message.reply({ embeds: [embedBuilder.error('Failed to Send', 'An error occurred while sending the announcement.')] });
        }
    }
};