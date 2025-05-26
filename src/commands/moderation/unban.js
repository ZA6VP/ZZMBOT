const { PermissionFlagsBits } = require('discord.js');
const { hasPermission } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed, createModerationEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'unban',
        description: 'Unban a user from the server',
        usage: '!unban <userID> [reason]',
        aliases: ['ub'],
        cooldown: 5
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.BanMembers)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Ban Members" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if user ID was provided
        const userId = args[0];
        if (!userId || !/^\d{17,19}$/.test(userId)) {
            const embed = createErrorEmbed('Invalid Usage', 'Please provide a valid user ID.\nUsage: `!unban <userID> [reason]`');
            return message.reply({ embeds: [embed] });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            // Check if user is actually banned
            const bans = await message.guild.bans.fetch();
            const bannedUser = bans.get(userId);
            
            if (!bannedUser) {
                const embed = createErrorEmbed('User Not Banned', 'This user is not banned from the server.');
                return message.reply({ embeds: [embed] });
            }

            // Unban the user
            await message.guild.members.unban(userId, `${message.author.tag}: ${reason}`);

            // Success message
            const embed = createSuccessEmbed('User Unbanned', `**${bannedUser.user.tag}** has been unbanned.\n**Reason:** ${reason}`);
            await message.reply({ embeds: [embed] });

            // Log to mod-logs channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.logChannel);
            if (logChannel) {
                const logEmbed = createModerationEmbed('Unbanned', bannedUser.user, message.author, reason);
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

        } catch (error) {
            console.error('Error unbanning user:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while trying to unban the user.');
            message.reply({ embeds: [embed] });
        }
    },
};
