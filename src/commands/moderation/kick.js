const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, canModerate } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed, createModerationEmbed } = require('../../utils/embedBuilder');
const Infraction = require('../../models/Infraction');

module.exports = {
    data: {
        name: 'kick',
        description: 'Kick a user from the server',
        usage: '!kick <@user> [reason]',
        aliases: ['k'],
        cooldown: 3
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.KickMembers)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Kick Members" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if user was mentioned
        const target = message.mentions.members.first();
        if (!target) {
            const embed = createErrorEmbed('Invalid Usage', 'Please mention a user to kick.\nUsage: `!kick <@user> [reason]`');
            return message.reply({ embeds: [embed] });
        }

        // Check if user can be moderated
        if (!canModerate(message.member, target)) {
            const embed = createErrorEmbed('Cannot Kick User', 'You cannot kick this user due to role hierarchy or permissions.');
            return message.reply({ embeds: [embed] });
        }

        // Check if bot can kick the user
        if (!target.kickable) {
            const embed = createErrorEmbed('Cannot Kick User', 'I cannot kick this user. They may have higher permissions than me.');
            return message.reply({ embeds: [embed] });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            // Send DM to user before kicking
            try {
                const dmEmbed = createModerationEmbed('Kicked', target.user, message.author, reason)
                    .setTitle('You have been kicked')
                    .setDescription(`You have been kicked from **${message.guild.name}**.`)
                    .setColor('#FFA500');
                
                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Could not send DM to user');
            }

            // Kick the user
            await target.kick(`${message.author.tag}: ${reason}`);

            // Log the infraction
            const infraction = new Infraction({
                userId: target.user.id,
                guildId: message.guild.id,
                moderatorId: message.author.id,
                type: 'kick',
                reason: reason
            });
            await infraction.save();

            // Success message
            const embed = createSuccessEmbed('User Kicked', `**${target.user.tag}** has been kicked.\n**Reason:** ${reason}`);
            await message.reply({ embeds: [embed] });

            // Log to mod-logs channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.logChannel);
            if (logChannel) {
                const logEmbed = createModerationEmbed('Kicked', target.user, message.author, reason);
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

        } catch (error) {
            console.error('Error kicking user:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while trying to kick the user.');
            message.reply({ embeds: [embed] });
        }
    },
};
