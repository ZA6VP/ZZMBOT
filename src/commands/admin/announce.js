const { PermissionFlagsBits } = require('discord.js');
const { hasPermission } = require('../../utils/permissionChecks');
const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'announce',
        description: 'Send an announcement to a specific channel',
        usage: '!announce <#channel> <message>',
        aliases: ['announcement'],
        cooldown: 5
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.Administrator)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Administrator" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if channel was mentioned
        const targetChannel = message.mentions.channels.first();
        if (!targetChannel) {
            const embed = createErrorEmbed('Invalid Usage', 'Please mention a channel to send the announcement to.\nUsage: `!announce <#channel> <message>`');
            return message.reply({ embeds: [embed] });
        }

        // Check if message was provided
        const announcementText = args.slice(1).join(' ');
        if (!announcementText) {
            const embed = createErrorEmbed('Invalid Usage', 'Please provide a message for the announcement.\nUsage: `!announce <#channel> <message>`');
            return message.reply({ embeds: [embed] });
        }

        try {
            // Create announcement embed
            const announcementEmbed = createInfoEmbed('📢 Announcement', announcementText)
                .setFooter({ text: `Announcement by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            // Send announcement
            await targetChannel.send({ embeds: [announcementEmbed] });

            // Confirm to sender
            const confirmEmbed = createSuccessEmbed('Announcement Sent', 
                `Your announcement has been sent to ${targetChannel}.`
            );
            await message.reply({ embeds: [confirmEmbed] });

            // Log to mod-logs channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.logChannel);
            if (logChannel && logChannel.id !== targetChannel.id) {
                const logEmbed = createInfoEmbed('Announcement Sent', 
                    `${message.author.tag} sent an announcement to ${targetChannel}\n**Message:** ${announcementText.substring(0, 500)}${announcementText.length > 500 ? '...' : ''}`
                );
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

        } catch (error) {
            console.error('Error sending announcement:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while sending the announcement.');
            message.reply({ embeds: [embed] });
        }
    },
};
