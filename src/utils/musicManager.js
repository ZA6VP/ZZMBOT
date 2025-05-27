
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytsr = require('youtube-sr').default;
const SpotifyWebApi = require('spotify-web-api-node');

class MusicManager {
    constructor() {
        this.queues = new Map(); // Guild ID -> Queue
        this.players = new Map(); // Guild ID -> Audio Player
        this.connections = new Map(); // Guild ID -> Voice Connection
        this.currentTracks = new Map(); // Guild ID -> Current Track
        
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
            
            // Refresh token every 50 minutes
            setInterval(async () => {
                try {
                    const data = await this.spotifyApi.clientCredentialsGrant();
                    this.spotifyApi.setAccessToken(data.body['access_token']);
                    console.log('Spotify token refreshed successfully');
                } catch (error) {
                    console.error('Error refreshing Spotify token:', error);
                }
            }, 3000000); // 50 minutes
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
                image: track.album.images[0]?.url,
                album: track.album.name
            }));
        } catch (error) {
            console.error('Error searching Spotify:', error);
            return [];
        }
    }

    async searchYouTube(query) {
        try {
            console.log(`Searching YouTube for: ${query}`);
            
            // Search for videos using youtube-sr
            const searchResults = await ytsr.search(query, {
                limit: 10,
                type: 'video'
            });
            
            if (!searchResults || searchResults.length === 0) {
                console.log('No YouTube results found');
                return null;
            }
            
            // Filter out short videos and try each result
            const filteredResults = searchResults.filter(video => 
                video.duration && 
                video.duration.seconds > 30 && 
                video.duration.seconds < 600 // Between 30 seconds and 10 minutes
            );
            
            const resultsToTry = filteredResults.length > 0 ? filteredResults : searchResults;
            
            for (const video of resultsToTry) {
                try {
                    console.log(`Checking video: ${video.title} (${video.duration?.text || 'unknown duration'})`);
                    
                    // Validate the video URL with ytdl-core
                    const isValid = ytdl.validateURL(video.url);
                    if (isValid) {
                        // Double check by getting basic info
                        const info = await ytdl.getBasicInfo(video.url);
                        if (info && info.videoDetails && !info.videoDetails.isLiveContent) {
                            console.log(`✅ Found working YouTube video: ${video.title} - ${video.url}`);
                            return video.url;
                        }
                    }
                } catch (err) {
                    console.log(`❌ Video ${video.url} not valid:`, err.message);
                    continue;
                }
            }
            
            console.log('No valid YouTube videos found after checking all results');
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
            console.log(`Attempting to join voice channel: ${channel.name}`);
            
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });

            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log(`Voice connection ready in ${channel.name}`);
            });

            connection.on(VoiceConnectionStatus.Disconnected, () => {
                console.log('Voice connection disconnected');
                // Try to reconnect
                setTimeout(() => {
                    if (connection.state.status === VoiceConnectionStatus.Disconnected) {
                        connection.destroy();
                        this.connections.delete(channel.guild.id);
                    }
                }, 5000);
            });

            connection.on('error', error => {
                console.error('Voice connection error:', error);
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
                console.error('No voice connection found for guild');
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

                player.on(AudioPlayerStatus.Playing, () => {
                    console.log('Audio player is now playing');
                });

                player.on('error', error => {
                    console.error('Audio player error:', error);
                    this.playNext(guildId);
                });
            }

            console.log(`Attempting to play: ${track.name} by ${track.artist}`);
            this.currentTracks.set(guildId, track);
            
            // First, try to use Spotify preview URL if available
            if (track.preview_url) {
                console.log(`Using Spotify preview URL: ${track.preview_url}`);
                
                try {
                    const fetch = require('node-fetch');
                    const response = await fetch(track.preview_url);
                    
                    if (response.ok) {
                        const resource = createAudioResource(response.body, {
                            inputType: 'arbitrary',
                            inlineVolume: true
                        });
                        
                        // Set volume to 50%
                        if (resource.volume) {
                            resource.volume.setVolume(0.5);
                        }
                        
                        player.play(resource);
                        console.log(`Successfully started playing Spotify preview: ${track.name} by ${track.artist}`);
                        return true;
                    }
                } catch (spotifyError) {
                    console.log('Spotify preview failed, falling back to YouTube:', spotifyError.message);
                }
            } else {
                console.log('No Spotify preview available, searching YouTube as fallback');
            }
            
            // Fallback to YouTube if Spotify preview not available or failed
            const searchQuery = `${track.name} ${track.artist}`;
            const youtubeUrl = await this.searchYouTube(searchQuery);
            
            if (!youtubeUrl) {
                console.error('Could not find YouTube video for track and no Spotify preview available');
                return false;
            }
            
            try {
                console.log(`Creating audio stream from: ${youtubeUrl}`);
                
                // Try different quality options if one fails
                const qualityOptions = [
                    { filter: 'audioonly', quality: 'highestaudio' },
                    { filter: 'audioonly', quality: 'lowestaudio' },
                    { filter: 'audio', quality: 'highestaudio' }
                ];
                
                let stream = null;
                let lastError = null;
                
                for (const options of qualityOptions) {
                    try {
                        console.log(`Trying audio extraction with options:`, options);
                        
                        stream = ytdl(youtubeUrl, {
                            ...options,
                            highWaterMark: 1 << 25,
                            requestOptions: {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                                }
                            }
                        });
                        
                        // Test if stream works by waiting for first data
                        await new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => reject(new Error('Stream timeout')), 10000);
                            stream.once('response', () => {
                                clearTimeout(timeout);
                                resolve();
                            });
                            stream.once('error', (err) => {
                                clearTimeout(timeout);
                                reject(err);
                            });
                        });
                        
                        console.log(`Successfully created stream with options:`, options);
                        break;
                        
                    } catch (streamError) {
                        console.log(`Failed with options ${JSON.stringify(options)}:`, streamError.message);
                        lastError = streamError;
                        stream = null;
                    }
                }
                
                if (!stream) {
                    console.error('All audio extraction methods failed. Last error:', lastError);
                    return false;
                }
                
                const resource = createAudioResource(stream, {
                    inputType: 'arbitrary',
                    inlineVolume: true
                });
                
                // Set volume to 50%
                if (resource.volume) {
                    resource.volume.setVolume(0.5);
                }
                
                player.play(resource);
                console.log(`Successfully started playing: ${track.name} by ${track.artist}`);
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
            console.log('Queue is empty, will disconnect in 5 minutes if no new tracks');
            this.currentTracks.delete(guildId);
            
            // Disconnect after 5 minutes of inactivity
            setTimeout(() => {
                if (this.getQueue(guildId).length === 0) {
                    console.log('Disconnecting due to inactivity');
                    this.disconnect(guildId);
                }
            }, 300000);
            return;
        }

        const nextTrack = queue.shift();
        console.log(`Playing next track: ${nextTrack.name}`);
        await this.playTrack(guildId, nextTrack);
    }

    skip(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            console.log('Skipping current track');
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
        this.currentTracks.delete(guildId);
        console.log(`Disconnected from voice channel in guild ${guildId}`);
    }

    getCurrentTrack(guildId) {
        return this.currentTracks.get(guildId) || null;
    }

    getQueueStatus(guildId) {
        const queue = this.getQueue(guildId);
        const player = this.players.get(guildId);
        const isPlaying = player && player.state.status === AudioPlayerStatus.Playing;
        const currentTrack = this.getCurrentTrack(guildId);
        
        return {
            queue: queue,
            queueLength: queue.length,
            isPlaying: isPlaying,
            currentTrack: currentTrack
        };
    }
}

module.exports = new MusicManager();
