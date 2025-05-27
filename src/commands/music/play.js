
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embedBuilder');
const musicManager = require('../../utils/musicManager');

module.exports = {
    data: {
        name: 'play',
        description: 'Play a song from Spotify',
        usage: '!play <song name>',
        aliases: ['p'],
        cooldown: 3
    },
    async execute(message, args) {
        // Force refresh member object to get current voice state
        try {
            await message.member.fetch();
        } catch (error) {
            console.error('Error fetching member:', error);
        }

        // Check if user is in a voice channel
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            const embed = createErrorEmbed('No Voice Channel', 'You need to be in a voice channel to play music!');
            return message.reply({ embeds: [embed] });
        }

        // Check if bot has permissions to join and speak
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            const embed = createErrorEmbed('Missing Permissions', 'I need permissions to join and speak in your voice channel!');
            return message.reply({ embeds: [embed] });
        }

        // Get search query
        const query = args.join(' ');
        if (!query) {
            const embed = createErrorEmbed('No Song Specified', 'Please provide a song name to search for!\nUsage: `!play <song name>`');
            return message.reply({ embeds: [embed] });
        }

        try {
            // Send searching message
            const searchingEmbed = createInfoEmbed('🔍 Searching...', `Looking for: **${query}**`);
            const searchMessage = await message.reply({ embeds: [searchingEmbed] });

            // Search Spotify for the track
            const spotifyResults = await musicManager.searchSpotify(query, 1);
            
            if (spotifyResults.length === 0) {
                const embed = createErrorEmbed('No Results', `No songs found for: **${query}**`);
                return searchMessage.edit({ embeds: [embed] });
            }

            const track = spotifyResults[0];
            
            // Join voice channel if not already connected
            let connection = musicManager.connections.get(message.guild.id);
            if (!connection) {
                connection = await musicManager.joinChannel(voiceChannel);
                if (!connection) {
                    const embed = createErrorEmbed('Connection Failed', 'Failed to join the voice channel!');
                    return searchMessage.edit({ embeds: [embed] });
                }
            }

            // Add to queue
            const position = musicManager.addToQueue(message.guild.id, track);
            
            if (position === 1) {
                // Start playing immediately if this is the first song
                const success = await musicManager.playTrack(message.guild.id, track);
                
                if (success) {
                    const embed = createSuccessEmbed('🎵 Now Playing', 
                        `**${track.name}** by **${track.artist}**`
                    )
                    .addFields(
                        { name: 'Duration', value: `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`, inline: true },
                        { name: 'Requested by', value: message.author.toString(), inline: true }
                    );
                    
                    if (track.image) {
                        embed.setThumbnail(track.image);
                    }
                    
                    searchMessage.edit({ embeds: [embed] });
                } else {
                    const embed = createErrorEmbed('Playback Failed', 'Failed to start playing the track. This might be due to the song not being available on YouTube.');
                    searchMessage.edit({ embeds: [embed] });
                }
            } else {
                // Added to queue
                const embed = createSuccessEmbed('📋 Added to Queue', 
                    `**${track.name}** by **${track.artist}**`
                )
                .addFields(
                    { name: 'Position in Queue', value: `${position}`, inline: true },
                    { name: 'Duration', value: `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`, inline: true },
                    { name: 'Requested by', value: message.author.toString(), inline: true }
                );
                
                if (track.image) {
                    embed.setThumbnail(track.image);
                }
                
                searchMessage.edit({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error in play command:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while trying to play the song.');
            message.reply({ embeds: [embed] });
        }
    },
};
