const { PermissionFlagsBits } = require('discord.js');
const { hasPermission } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'unlock',
        description: 'Unlock the current channel',
        usage: '!unlock [reason]',
        aliases: ['unlockdown'],
        cooldown: 5
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.ManageChannels)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Manage Channels" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        const reason = args.join(' ') || 'No reason provided';

        try {
            // Get the @everyone role
            const everyoneRole = message.guild.roles.everyone;

            // Restore send message permission for @everyone (set to null to use default)
            await message.channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null
            }, { reason: `Channel unlocked by ${message.author.tag}: ${reason}` });

            const embed = createSuccessEmbed('Channel Unlocked', 
                `🔓 This channel has been unlocked.\n**Reason:** ${reason}\n**Unlocked by:** ${message.author.tag}`
            );
            
            await message.reply({ embeds: [embed] });

            // Log to mod-logs channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.logChannel);
            if (logChannel && logChannel.id !== message.channel.id) {
                const logEmbed = createInfoEmbed('Channel Unlocked', 
                    `${message.channel} was unlocked by ${message.author.tag}\n**Reason:** ${reason}`
                );
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

        } catch (error) {
            console.error('Error unlocking channel:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while trying to unlock the channel.');
            message.reply({ embeds: [embed] });
        }
    },
};
