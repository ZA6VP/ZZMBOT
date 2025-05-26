const { PermissionFlagsBits } = require('discord.js');
const { hasPermission } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'purge',
        description: 'Delete multiple messages',
        usage: '!purge <number>',
        aliases: ['clear', 'delete'],
        cooldown: 5
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.ManageMessages)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Manage Messages" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if number was provided
        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) {
            const embed = createErrorEmbed('Invalid Amount', 'Please provide a number between 1 and 100.');
            return message.reply({ embeds: [embed] });
        }

        try {
            // Delete the command message first
            await message.delete().catch(console.error);

            // Fetch and delete messages
            const messages = await message.channel.messages.fetch({ limit: amount });
            const deletedMessages = await message.channel.bulkDelete(messages, true);

            // Send confirmation (will auto-delete after 5 seconds)
            const embed = createSuccessEmbed('Messages Purged', 
                `Successfully deleted **${deletedMessages.size}** messages.`
            );
            
            const confirmation = await message.channel.send({ embeds: [embed] });
            
            // Delete confirmation after 5 seconds
            setTimeout(() => {
                confirmation.delete().catch(console.error);
            }, 5000);

            // Log to mod-logs channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.logChannel);
            if (logChannel && logChannel.id !== message.channel.id) {
                const logEmbed = createInfoEmbed('Messages Purged', 
                    `**${deletedMessages.size}** messages were purged from ${message.channel} by ${message.author.tag}`
                );
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

        } catch (error) {
            console.error('Error purging messages:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while purging messages. Note: Messages older than 14 days cannot be bulk deleted.');
            message.channel.send({ embeds: [embed] }).then(msg => {
                setTimeout(() => msg.delete().catch(console.error), 5000);
            });
        }
    },
};
