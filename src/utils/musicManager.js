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

    async findYouTubeAlternative(trackName, artistName) {
        try {
            // Simple search for YouTube videos using ytdl-core
            const searchQuery = `${trackName} ${artistName}`.replace(/[^\w\s]/gi, '');
            // For now, we'll use a basic approach - in production you'd want YouTube API
            const testUrl = `https://www.youtube.com/watch?v=dQw4w9WgXcQ`; // placeholder
            
            // Try to validate if ytdl can handle this
            const info = await ytdl.getBasicInfo(testUrl);
            if (info) {
                return testUrl;
            }
            return null;
        } catch (error) {
            console.error('Error finding YouTube alternative:', error);
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
            }

            // For now, we'll use YouTube as the audio source since Spotify doesn't provide full tracks
            const youtubeUrl = await this.findYouTubeAlternative(track.name, track.artist);
            if (!youtubeUrl) {
                console.error('Could not find YouTube alternative for track');
                return false;
            }

            const stream = ytdl(youtubeUrl, { filter: 'audioonly', quality: 'highestaudio' });
            const resource = createAudioResource(stream);
            
            player.play(resource);
            return true;
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