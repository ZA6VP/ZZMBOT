const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const SpotifyWebApi = require('spotify-web-api-node');
const fetch = require('node-fetch');

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
            
            // Create search URL for YouTube
            const searchTerm = encodeURIComponent(query);
            const searchUrl = `https://www.youtube.com/results?search_query=${searchTerm}`;
            
            try {
                // Fetch YouTube search results page
                const response = await fetch(searchUrl);
                const html = await response.text();
                
                // Extract video IDs from the HTML using regex
                const videoIdRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
                const matches = [];
                let match;
                
                while ((match = videoIdRegex.exec(html)) !== null && matches.length < 5) {
                    matches.push(match[1]);
                }
                
                // Try each video ID to find one that works
                for (const videoId of matches) {
                    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    try {
                        // Test if this video works with ytdl-core
                        const info = await ytdl.getBasicInfo(videoUrl);
                        if (info && info.videoDetails && !info.videoDetails.isLiveContent) {
                            console.log(`Found working YouTube video: ${videoUrl} - ${info.videoDetails.title}`);
                            return videoUrl;
                        }
                    } catch (err) {
                        console.log(`Video ${videoUrl} not available, trying next...`);
                        continue;
                    }
                }
                
                // If no videos from search work, return null
                console.log('No working videos found for search term');
                return null;
                
            } catch (fetchError) {
                console.error('Error fetching YouTube search results:', fetchError);
                return null;
            }
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
            if (!connection) {
                console.error('No voice connection found');
                return false;
            }

            let player = this.players.get(guildId);
            if (!player) {
                player = createAudioPlayer();
                this.players.set(guildId, player);
                connection.subscribe(player);

                player.on(AudioPlayerStatus.Idle, () => {
                    console.log('Track finished, playing next...');
                    this.playNext(guildId);
                });

                player.on('error', error => {
                    console.error('Audio player error:', error);
                    this.playNext(guildId);
                });
            }

            console.log(`Attempting to play: ${track.name} by ${track.artist}`);
            
            // Search for the track on YouTube
            const youtubeUrl = await this.searchYouTube(`${track.name} ${track.artist} official`);
            
            if (!youtubeUrl) {
                console.error(`Could not find YouTube video for: ${track.name} by ${track.artist}`);
                return false;
            }
            
            try {
                // Validate the YouTube URL first
                const info = await ytdl.getBasicInfo(youtubeUrl);
                if (!info || !info.videoDetails || info.videoDetails.isLiveContent) {
                    console.error('Invalid or live content video');
                    return false;
                }

                console.log(`Creating audio stream for: ${info.videoDetails.title}`);
                
                const stream = ytdl(youtubeUrl, { 
                    filter: 'audioonly', 
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25,
                    requestOptions: {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    }
                });
                
                const resource = createAudioResource(stream, {
                    inputType: 'arbitrary',
                    inlineVolume: true
                });
                
                player.play(resource);
                console.log(`Successfully started playing: ${track.name} by ${track.artist}`);
                return true;
                
            } catch (ytdlError) {
                console.error('YTDL error:', ytdlError.message);
                
                // Try alternative search
                const altUrl = await this.searchYouTube(`${track.artist} ${track.name} audio`);
                if (altUrl && altUrl !== youtubeUrl) {
                    try {
                        const stream = ytdl(altUrl, { 
                            filter: 'audioonly', 
                            quality: 'highestaudio'
                        });
                        const resource = createAudioResource(stream);
                        player.play(resource);
                        console.log(`Started playing alternative version: ${track.name}`);
                        return true;
                    } catch (altError) {
                        console.error('Alternative search also failed:', altError.message);
                    }
                }
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