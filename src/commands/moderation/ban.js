const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, canModerate } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed, createModerationEmbed } = require('../../utils/embedBuilder');
const Infraction = require('../../models/Infraction');

module.exports = {
    data: {
        name: 'ban',
        description: 'Ban a user from the server',
        usage: '!ban <@user> [reason]',
        aliases: ['b'],
        cooldown: 5
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.BanMembers)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Ban Members" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if user was mentioned
        const target = message.mentions.members.first();
        if (!target) {
            const embed = createErrorEmbed('Invalid Usage', 'Please mention a user to ban.\nUsage: `!ban <@user> [reason]`');
            return message.reply({ embeds: [embed] });
        }

        // Check if user can be moderated
        if (!canModerate(message.member, target)) {
            const embed = createErrorEmbed('Cannot Ban User', 'You cannot ban this user due to role hierarchy or permissions.');
            return message.reply({ embeds: [embed] });
        }

        // Check if bot can ban the user
        if (!target.bannable) {
            const embed = createErrorEmbed('Cannot Ban User', 'I cannot ban this user. They may have higher permissions than me.');
            return message.reply({ embeds: [embed] });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            // Send DM to user before banning
            try {
                const dmEmbed = createModerationEmbed('Banned', target.user, message.author, reason)
                    .setTitle('You have been permanently banned')
                    .setDescription(`You have been banned from **${message.guild.name}**.`)
                    .setColor('#FF0000');
                
                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Could not send DM to user');
            }

            // Ban the user
            await target.ban({ reason: `${message.author.tag}: ${reason}` });

            // Log the infraction
            const infraction = new Infraction({
                userId: target.user.id,
                guildId: message.guild.id,
                moderatorId: message.author.id,
                type: 'ban',
                reason: reason
            });
            await infraction.save();

            // Success message
            const embed = createSuccessEmbed('User Banned', `**${target.user.tag}** has been banned.\n**Reason:** ${reason}`);
            await message.reply({ embeds: [embed] });

            // Log to mod-logs channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.logChannel);
            if (logChannel) {
                const logEmbed = createModerationEmbed('Banned', target.user, message.author, reason);
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

        } catch (error) {
            console.error('Error banning user:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while trying to ban the user.');
            message.reply({ embeds: [embed] });
        }
    },
};
