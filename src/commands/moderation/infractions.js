const { PermissionFlagsBits } = require('discord.js');
const { hasPermission } = require('../../utils/permissionChecks');
const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const Infraction = require('../../models/Infraction');

module.exports = {
    data: {
        name: 'infractions',
        description: 'View a user\'s infractions',
        usage: '!infractions <@user>',
        aliases: ['inf', 'history'],
        cooldown: 3
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.ManageMessages)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Manage Messages" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if user was mentioned
        const target = message.mentions.members.first() || message.member;
        const user = target.user;

        try {
            // Get all infractions for this user
            const infractions = await Infraction.find({
                userId: user.id,
                guildId: message.guild.id
            }).sort({ createdAt: -1 }).limit(15);

            if (infractions.length === 0) {
                const embed = createInfoEmbed('No Infractions', `${user.tag} has no recorded infractions.`);
                return message.reply({ embeds: [embed] });
            }

            // Count infractions by type
            const counts = {
                warn: 0,
                kick: 0,
                ban: 0,
                timeout: 0,
                mute: 0
            };

            infractions.forEach(inf => {
                counts[inf.type]++;
            });

            // Create embed
            const embed = createInfoEmbed(`Infractions for ${user.tag}`, 
                `**Total:** ${infractions.length} infractions\n` +
                `**Warnings:** ${counts.warn} | **Kicks:** ${counts.kick} | **Bans:** ${counts.ban}\n` +
                `**Timeouts:** ${counts.timeout} | **Mutes:** ${counts.mute}`
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }));

            // Add recent infractions
            const recentInfractions = infractions.slice(0, 5);
            recentInfractions.forEach((inf, index) => {
                const moderator = message.guild.members.cache.get(inf.moderatorId);
                const moderatorName = moderator ? moderator.user.tag : 'Unknown Moderator';
                
                embed.addFields({
                    name: `${index + 1}. ${inf.type.charAt(0).toUpperCase() + inf.type.slice(1)}`,
                    value: `**Moderator:** ${moderatorName}\n**Reason:** ${inf.reason}\n**Date:** <t:${Math.floor(inf.createdAt.getTime() / 1000)}:R>`,
                    inline: true
                });
            });

            if (infractions.length > 5) {
                embed.setFooter({ text: `Showing 5 of ${infractions.length} total infractions` });
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching infractions:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while fetching infractions.');
            message.reply({ embeds: [embed] });
        }
    },
};
