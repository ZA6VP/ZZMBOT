const { PermissionFlagsBits } = require('discord.js');
const { hasPermission } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'lock',
        description: 'Lock the current channel',
        usage: '!lock [reason]',
        aliases: ['lockdown'],
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

            // Remove send message permission for @everyone
            await message.channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false
            }, { reason: `Channel locked by ${message.author.tag}: ${reason}` });

            const embed = createSuccessEmbed('Channel Locked', 
                `🔒 This channel has been locked.\n**Reason:** ${reason}\n**Locked by:** ${message.author.tag}`
            );
            
            await message.reply({ embeds: [embed] });

            // Log to mod-logs channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.logChannel);
            if (logChannel && logChannel.id !== message.channel.id) {
                const logEmbed = createInfoEmbed('Channel Locked', 
                    `${message.channel} was locked by ${message.author.tag}\n**Reason:** ${reason}`
                );
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

        } catch (error) {
            console.error('Error locking channel:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while trying to lock the channel.');
            message.reply({ embeds: [embed] });
        }
    },
};
