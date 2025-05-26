const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, canModerate } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed, createModerationEmbed } = require('../../utils/embedBuilder');
const Infraction = require('../../models/Infraction');

function parseDuration(duration) {
    const regex = /^(\d+)([smhdw])$/;
    const match = duration.toLowerCase().match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
        'w': 7 * 24 * 60 * 60 * 1000
    };
    
    const ms = value * multipliers[unit];
    
    // Discord timeout limit is 28 days
    if (ms > 28 * 24 * 60 * 60 * 1000) return null;
    
    return ms;
}

module.exports = {
    data: {
        name: 'timeout',
        description: 'Timeout a user',
        usage: '!timeout <@user> <duration> [reason]',
        aliases: ['to', 'mute'],
        cooldown: 3
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.ModerateMembers)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Timeout Members" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if user was mentioned
        const target = message.mentions.members.first();
        if (!target) {
            const embed = createErrorEmbed('Invalid Usage', 'Please mention a user to timeout.\nUsage: `!timeout <@user> <duration> [reason]`');
            return message.reply({ embeds: [embed] });
        }

        // Check duration
        const duration = args[1];
        if (!duration) {
            const embed = createErrorEmbed('Invalid Usage', 'Please specify a duration (e.g., 10m, 2h, 1d).\nUsage: `!timeout <@user> <duration> [reason]`');
            return message.reply({ embeds: [embed] });
        }

        const durationMs = parseDuration(duration);
        if (!durationMs) {
            const embed = createErrorEmbed('Invalid Duration', 'Please provide a valid duration (s, m, h, d, w). Maximum is 28 days.');
            return message.reply({ embeds: [embed] });
        }

        // Check if user can be moderated
        if (!canModerate(message.member, target)) {
            const embed = createErrorEmbed('Cannot Timeout User', 'You cannot timeout this user due to role hierarchy or permissions.');
            return message.reply({ embeds: [embed] });
        }

        // Check if bot can timeout the user
        if (!target.moderatable) {
            const embed = createErrorEmbed('Cannot Timeout User', 'I cannot timeout this user. They may have higher permissions than me.');
            return message.reply({ embeds: [embed] });
        }

        const reason = args.slice(2).join(' ') || 'No reason provided';

        try {
            // Send DM to user before timeout
            try {
                const dmEmbed = createModerationEmbed('Timed Out', target.user, message.author, reason, duration)
                    .setTitle('You have been timed out')
                    .setDescription(`You have been timed out in **${message.guild.name}** for ${duration}.`)
                    .setColor('#FFAA00');
                
                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Could not send DM to user');
            }

            // Timeout the user
            await target.timeout(durationMs, `${message.author.tag}: ${reason}`);

            // Log the infraction
            const infraction = new Infraction({
                userId: target.user.id,
                guildId: message.guild.id,
                moderatorId: message.author.id,
                type: 'timeout',
                reason: reason,
                duration: duration
            });
            await infraction.save();

            // Success message
            const embed = createSuccessEmbed('User Timed Out', 
                `**${target.user.tag}** has been timed out for ${duration}.\n**Reason:** ${reason}`
            );
            await message.reply({ embeds: [embed] });

            // Log to mod-logs channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.logChannel);
            if (logChannel) {
                const logEmbed = createModerationEmbed('Timed Out', target.user, message.author, reason, duration);
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

        } catch (error) {
            console.error('Error timing out user:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while trying to timeout the user.');
            message.reply({ embeds: [embed] });
        }
    },
};
