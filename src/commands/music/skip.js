const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const { hasPermission } = require('../../utils/permissionChecks');
const musicManager = require('../../utils/musicManager');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: {
        name: 'skip',
        description: 'Skip the current track (Admin only)',
        usage: '!skip',
        category: 'music',
        cooldown: 2
    },
    async execute(message, args) {
        // Check if user has "Deafen Users" permission (as requested)
        if (!hasPermission(message.member, PermissionFlagsBits.DeafenMembers)) {
            return message.reply('You need the "Deafen Users" permission to skip tracks!');
        }

        // Check if bot is playing music
        const queueStatus = musicManager.getQueueStatus(message.guild.id);
        if (!queueStatus.isPlaying) {
            return message.reply('There is no music currently playing!');
        }

        try {
            // Skip the current track
            const skipped = musicManager.skip(message.guild.id);
            
            if (skipped) {
                const embed = createInfoEmbed('⏭️ Track Skipped', 
                    `${message.author.username} skipped the current track!`
                )
                .setColor('#FF6B6B');

                // Check if there are more tracks in queue
                const updatedStatus = musicManager.getQueueStatus(message.guild.id);
                if (updatedStatus.queueLength > 0) {
                    embed.addFields(
                        { name: 'Up Next', value: `${updatedStatus.queueLength} track(s) in queue`, inline: true }
                    );
                }

                message.channel.send({ embeds: [embed] });
            } else {
                message.reply('Failed to skip the track. Please try again!');
            }
        } catch (error) {
            console.error('Error skipping track:', error);
            message.reply('There was an error skipping the track!');
        }
    },
};