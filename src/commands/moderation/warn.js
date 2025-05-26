const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, canModerate } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed, createModerationEmbed } = require('../../utils/embedBuilder');
const Infraction = require('../../models/Infraction');

module.exports = {
    data: {
        name: 'warn',
        description: 'Issue a warning to a user',
        usage: '!warn <@user> [reason]',
        aliases: ['w'],
        cooldown: 3
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.ManageMessages)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Manage Messages" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if user was mentioned
        const target = message.mentions.members.first();
        if (!target) {
            const embed = createErrorEmbed('Invalid Usage', 'Please mention a user to warn.\nUsage: `!warn <@user> [reason]`');
            return message.reply({ embeds: [embed] });
        }

        // Check if user can be moderated
        if (!canModerate(message.member, target)) {
            const embed = createErrorEmbed('Cannot Warn User', 'You cannot warn this user due to role hierarchy or permissions.');
            return message.reply({ embeds: [embed] });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            // Log the infraction
            const infraction = new Infraction({
                userId: target.user.id,
                guildId: message.guild.id,
                moderatorId: message.author.id,
                type: 'warn',
                reason: reason
            });
            await infraction.save();

            // Get total warnings for this user
            const totalWarnings = await Infraction.countDocuments({
                userId: target.user.id,
                guildId: message.guild.id,
                type: 'warn'
            });

            // Send DM to user
            try {
                const dmEmbed = createModerationEmbed('Warning', target.user, message.author, reason)
                    .setTitle('You have received a warning')
                    .setDescription(`You have been warned in **${message.guild.name}**.`)
                    .addFields({ name: 'Total Warnings', value: totalWarnings.toString(), inline: true })
                    .setColor('#FFAA00');
                
                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Could not send DM to user');
            }

            // Success message
            const embed = createSuccessEmbed('User Warned', 
                `**${target.user.tag}** has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${totalWarnings}`
            );
            await message.reply({ embeds: [embed] });

            // Log to mod-logs channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.logChannel);
            if (logChannel) {
                const logEmbed = createModerationEmbed('Warning Issued', target.user, message.author, reason)
                    .addFields({ name: 'Total Warnings', value: totalWarnings.toString(), inline: true });
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

        } catch (error) {
            console.error('Error warning user:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while trying to warn the user.');
            message.reply({ embeds: [embed] });
        }
    },
};
