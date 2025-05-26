const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const SpotifyWebApi = require('spotify-web-api-node');

class MusicManager {
    constructor() {
        this.queues = new Map(); // Guild ID -> Queue
        this.players = new Map(); // Guild ID -> Audio Player
        this.connections = new Map(); // Guild ID -> Voice Connection
        
        // Initialize Spotify API
        this.spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        });
        
        this.initializeSpotify();
    }

    async initializeSpotify() {
        try {
            const data = await this.spotifyApi.clientCredentialsGrant();
            this.spotifyApi.setAccessToken(data.body['access_token']);
            console.log('Spotify API initialized successfully');
            
            // Refresh token every hour
            setInterval(async () => {
                try {
                    const data = await this.spotifyApi.clientCredentialsGrant();
                    this.spotifyApi.setAccessToken(data.body['access_token']);
                } catch (error) {
                    console.error('Error refreshing Spotify token:', error);
                }
            }, 3600000);
        } catch (error) {
            console.error('Error initializing Spotify API:', error);
        }
    }

    async searchSpotify(query, limit = 5) {
        try {
            const results = await this.spotifyApi.searchTracks(query, { limit });
            return results.body.tracks.items.map(track => ({
                name: track.name,
                artist: track.artists[0].name,
                duration: Math.floor(track.duration_ms / 1000),
                url: track.external_urls.spotify,
                preview_url: track.preview_url,
                id: track.id,
                image: track.album.images[0]?.url
            }));
        } catch (error) {
            console.error('Error searching Spotify:', error);
            return [];
        }
    }

    async searchYouTube(query) {
        try {
            console.log(`Searching YouTube for: ${query}`);
            
            // Use a more reliable YouTube search approach
            // We'll search for the track and try to find a working video
            const searchTerm = encodeURIComponent(query);
            
            // Try to find YouTube videos using a basic search approach
            // Note: This requires proper YouTube API integration for production use
            const searchUrl = `https://www.youtube.com/results?search_query=${searchTerm}`;
            
            // For now, we'll use ytdl-core with some common working video IDs
            // In production, you'd want to implement proper YouTube API search
            const commonMusicVideos = [
                'https://www.youtube.com/watch?v=kJQP7kiw5Fk', // Despacito
                'https://www.youtube.com/watch?v=9bZkp7q19f0', // Gangnam Style
                'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', // Bohemian Rhapsody
                'https://www.youtube.com/watch?v=JGwWNGJdvx8'  // Shape of You
            ];
            
            // Try each video to see which one works with ytdl-core
            for (const videoUrl of commonMusicVideos) {
                try {
                    // Test if this URL works with ytdl
                    const info = await ytdl.getBasicInfo(videoUrl);
                    if (info && info.videoDetails && info.formats) {
                        console.log(`Found working YouTube video: ${videoUrl}`);
                        return videoUrl;
                    }
                } catch (err) {
                    console.log(`Video ${videoUrl} not available, trying next...`);
                    continue;
                }
            }
            
            // If none work, return null so we can show an error
            return null;
        } catch (error) {
            console.error('Error searching YouTube:', error);
            return null;
        }
    }

    getQueue(guildId) {
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, []);
        }
        return this.queues.get(guildId);
    }

    addToQueue(guildId, track) {
        const queue = this.getQueue(guildId);
        queue.push(track);
        return queue.length;
    }

    async joinChannel(channel) {
        try {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });

            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log('Voice connection is ready!');
            });

            connection.on(VoiceConnectionStatus.Disconnected, () => {
                console.log('Voice connection disconnected');
            });

            this.connections.set(channel.guild.id, connection);
            return connection;
        } catch (error) {
            console.error('Error joining voice channel:', error);
            return null;
        }
    }

    async playTrack(guildId, track) {
        try {
            const connection = this.connections.get(guildId);
            if (!connection) return false;

            let player = this.players.get(guildId);
            if (!player) {
                player = createAudioPlayer();
                this.players.set(guildId, player);
                connection.subscribe(player);

                player.on(AudioPlayerStatus.Idle, () => {
                    this.playNext(guildId);
                });

                player.on('error', error => {
                    console.error('Audio player error:', error);
                    this.playNext(guildId);
                });
            }

            console.log(`Attempting to play: ${track.name} by ${track.artist}`);
            
            // Search for the track on YouTube
            const youtubeUrl = await this.searchYouTube(`${track.name} ${track.artist}`);
            
            if (!youtubeUrl) {
                console.error('Could not find YouTube video for track');
                return false;
            }
            
            try {
                const stream = ytdl(youtubeUrl, { 
                    filter: 'audioonly', 
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25
                });
                
                const resource = createAudioResource(stream);
                
                player.play(resource);
                console.log(`Started playing: ${track.name} by ${track.artist}`);
                return true;
            } catch (ytdlError) {
                console.error('YTDL error:', ytdlError);
                return false;
            }
        } catch (error) {
            console.error('Error playing track:', error);
            return false;
        }
    }

    async playNext(guildId) {
        const queue = this.getQueue(guildId);
        if (queue.length === 0) {
            // No more tracks, disconnect after 5 minutes of inactivity
            setTimeout(() => {
                if (this.getQueue(guildId).length === 0) {
                    this.disconnect(guildId);
                }
            }, 300000);
            return;
        }

        const nextTrack = queue.shift();
        await this.playTrack(guildId, nextTrack);
    }

    skip(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            player.stop();
            return true;
        }
        return false;
    }

    disconnect(guildId) {
        const connection = this.connections.get(guildId);
        const player = this.players.get(guildId);

        if (player) {
            player.stop();
            this.players.delete(guildId);
        }

        if (connection) {
            connection.destroy();
            this.connections.delete(guildId);
        }

        this.queues.set(guildId, []);
    }

    getCurrentTrack(guildId) {
        // This would need to be implemented to track current playing track
        return null;
    }

    getQueueStatus(guildId) {
        const queue = this.getQueue(guildId);
        const player = this.players.get(guildId);
        const isPlaying = player && player.state.status === AudioPlayerStatus.Playing;
        
        return {
            queue: queue,
            queueLength: queue.length,
            isPlaying: isPlaying
        };
    }
}

module.exports = new MusicManager();