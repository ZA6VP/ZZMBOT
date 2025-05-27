const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const SpotifyWebApi = require('spotify-web-api-node');

class MusicManager {
    constructor() {
        this.connections = new Map();
        this.players = new Map();
        this.queues = new Map();

        // Initialize Spotify API
        this.spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET
        });

        this.initializeSpotify();
    }

    async initializeSpotify() {
        try {
            const data = await this.spotifyApi.clientCredentialsGrant();
            this.spotifyApi.setAccessToken(data.body['access_token']);

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

    async joinChannel(voiceChannel) {
        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            this.connections.set(voiceChannel.guild.id, connection);

            connection.on(VoiceConnectionStatus.Disconnected, () => {
                this.connections.delete(voiceChannel.guild.id);
                this.players.delete(voiceChannel.guild.id);
                this.queues.delete(voiceChannel.guild.id);
            });

            return connection;
        } catch (error) {
            console.error('Error joining voice channel:', error);
            return null;
        }
    }

    async searchSpotify(query) {
        try {
            const results = await this.spotifyApi.searchTracks(query, { limit: 5 });
            return results.body.tracks.items.map(track => ({
                name: track.name,
                artist: track.artists[0].name,
                duration: track.duration_ms,
                image: track.album.images[0]?.url,
                spotifyId: track.id,
                uri: track.uri
            }));
        } catch (error) {
            console.error('Error searching Spotify:', error);
            return [];
        }
    }

    async getYouTubeUrl(trackName, artistName) {
        try {
            const searchQuery = `${trackName} ${artistName}`;
            // This is a simple implementation - you might want to use youtube-search-api for better results
            const searchUrl = `ytsearch:${searchQuery}`;
            return searchUrl;
        } catch (error) {
            console.error('Error getting YouTube URL:', error);
            return null;
        }
    }

    async playTrack(guildId, track) {
        try {
            const connection = this.connections.get(guildId);
            if (!connection) return false;

            // Try to get YouTube stream
            const searchQuery = `${track.name} ${track.artist}`;
            const youtubeUrl = await this.findYouTubeVideo(searchQuery);

            if (!youtubeUrl) {
                console.error('Could not find YouTube video for:', searchQuery);
                return false;
            }

            const stream = ytdl(youtubeUrl, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });

            const resource = createAudioResource(stream);
            const player = createAudioPlayer();

            player.play(resource);
            connection.subscribe(player);

            this.players.set(guildId, player);

            player.on(AudioPlayerStatus.Idle, () => {
                this.playNext(guildId);
            });

            player.on('error', error => {
                console.error('Audio player error:', error);
                this.playNext(guildId);
            });

            return true;
        } catch (error) {
            console.error('Error playing track:', error);
            return false;
        }
    }

    async findYouTubeVideo(query) {
        try {
            // Simple YouTube search - in production you'd want to use YouTube Data API
            const results = await ytdl.getInfo(`ytsearch:${query}`);
            return results.videoDetails.video_url;
        } catch (error) {
            // Fallback method
            try {
                const searchResults = await ytdl.getInfo(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
                return searchResults.videoDetails.video_url;
            } catch (fallbackError) {
                console.error('YouTube search failed:', fallbackError);
                return null;
            }
        }
    }

    addToQueue(guildId, track) {
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, []);
        }

        const queue = this.queues.get(guildId);
        queue.push(track);
        return queue.length;
    }

    getQueue(guildId) {
        return this.queues.get(guildId) || [];
    }

    getQueueStatus(guildId) {
        const player = this.players.get(guildId);
        const queue = this.queues.get(guildId) || [];

        return {
            isPlaying: player && player.state.status === AudioPlayerStatus.Playing,
            queue: queue,
            queueLength: queue.length
        };
    }

    async playNext(guildId) {
        const queue = this.queues.get(guildId);
        if (!queue || queue.length === 0) {
            return false;
        }

        const nextTrack = queue.shift();
        return await this.playTrack(guildId, nextTrack);
    }

    skip(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            player.stop();
            return true;
        }
        return false;
    }

    stop(guildId) {
        const player = this.players.get(guildId);
        const connection = this.connections.get(guildId);

        if (player) {
            player.stop();
        }

        if (connection) {
            connection.destroy();
        }

        this.players.delete(guildId);
        this.connections.delete(guildId);
        this.queues.delete(guildId);

        return true;
    }
}

module.exports = new MusicManager();