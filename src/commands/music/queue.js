const { createInfoEmbed } = require('../../utils/embedBuilder');
const musicManager = require('../../utils/musicManager');

module.exports = {
    data: {
        name: 'queue',
        description: 'Show the current music queue',
        usage: '!queue',
        category: 'music',
        cooldown: 3
    },
    async execute(message, args) {
        const queueStatus = musicManager.getQueueStatus(message.guild.id);
        
        if (!queueStatus.isPlaying && queueStatus.queueLength === 0) {
            return message.reply('The music queue is empty! Use `!play <song>` to add some music.');
        }

        let description = '';
        
        if (queueStatus.isPlaying) {
            description += '🎵 **Currently Playing**\n*Track info will be shown when available*\n\n';
        }

        if (queueStatus.queueLength > 0) {
            description += '📋 **Up Next:**\n';
            queueStatus.queue.slice(0, 10).forEach((track, index) => {
                const duration = Math.floor(track.duration / 60) + ':' + (track.duration % 60).toString().padStart(2, '0');
                description += `${index + 1}. **${track.name}** by ${track.artist} (${duration})\n`;
            });

            if (queueStatus.queueLength > 10) {
                description += `\n*...and ${queueStatus.queueLength - 10} more tracks*`;
            }
        } else {
            description += '📋 **Queue is empty**\nAdd more tracks with `!play <song>`';
        }

        const embed = createInfoEmbed('🎶 Music Queue', description)
            .setColor('#1DB954')
            .addFields(
                { name: 'Total Tracks', value: queueStatus.queueLength.toString(), inline: true },
                { name: 'Status', value: queueStatus.isPlaying ? '▶️ Playing' : '⏸️ Stopped', inline: true }
            );

        message.channel.send({ embeds: [embed] });
    },
};