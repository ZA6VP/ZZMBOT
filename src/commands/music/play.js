const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const musicManager = require('../../utils/musicManager');

module.exports = {
    data: {
        name: 'play',
        description: 'Play music from Spotify',
        usage: '!play <song name>',
        category: 'music',
        cooldown: 3
    },
    async execute(message, args) {
        // Check if user is in a voice channel
        const member = message.member;
        if (!member || !member.voice || !member.voice.channel) {
            return message.reply('You need to be in a voice channel to play music!');
        }

        const voiceChannel = member.voice.channel;
        console.log(`User ${message.author.username} is in voice channel: ${voiceChannel.name}`);

        // Check bot permissions in voice channel
        const botMember = message.guild.members.me;
        const permissions = voiceChannel.permissionsFor(botMember);
        if (!permissions.has(['Connect', 'Speak'])) {
            return message.reply('I need permission to connect and speak in your voice channel!');
        }

        // Check if a song was provided
        if (!args.length) {
            return message.reply('Please provide a song name to search for! Usage: `!play <song name>`');
        }

        const query = args.join(' ');
        
        try {
            // Search Spotify for tracks
            const tracks = await musicManager.searchSpotify(query, 5);
            
            if (tracks.length === 0) {
                return message.reply('No tracks found on Spotify for that search!');
            }

            // Create embed with track selection
            let description = 'Select a track to play:\n\n';
            tracks.forEach((track, index) => {
                const duration = Math.floor(track.duration / 60) + ':' + (track.duration % 60).toString().padStart(2, '0');
                description += `**${index + 1}.** ${track.name}\n*by ${track.artist}* (${duration})\n\n`;
            });

            const embed = createInfoEmbed('🎵 Spotify Search Results', description)
                .setColor('#1DB954')
                .setFooter({ text: 'Click a number to select the track!' });

            if (tracks[0].image) {
                embed.setThumbnail(tracks[0].image);
            }

            // Create selection buttons
            const row = new ActionRowBuilder();
            for (let i = 0; i < Math.min(tracks.length, 5); i++) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`select_track_${i}`)
                        .setLabel(`${i + 1}`)
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            const response = await message.channel.send({ embeds: [embed], components: [row] });

            // Store tracks for selection with proper voice channel reference
            if (!message.client.trackSelections) {
                message.client.trackSelections = new Map();
            }
            
            // Store the voice channel for later use
            const userVoiceChannel = voiceChannel;
            
            message.client.trackSelections.set(response.id, {
                tracks: tracks,
                requesterId: message.author.id,
                voiceChannel: userVoiceChannel,
                expiresAt: Date.now() + 300000 // 5 minutes instead of 1
            });

            console.log(`Stored track selection for message ${response.id}, expires in 5 minutes`);

            // Clean up after 5 minutes
            setTimeout(() => {
                if (message.client.trackSelections.has(response.id)) {
                    message.client.trackSelections.delete(response.id);
                    response.edit({ components: [] }).catch(() => {});
                    console.log(`Cleaned up expired track selection ${response.id}`);
                }
            }, 300000);

        } catch (error) {
            console.error('Error in play command:', error);
            message.reply('There was an error searching for tracks. Please try again!');
        }
    },
};