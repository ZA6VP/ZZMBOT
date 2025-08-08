const axios = require('axios');

class GifManager {
    constructor() {
        this.gifCache = new Map();
        this.lastUsedGifs = new Map();
        this.gifCategories = {
            happy: [
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
            ],
            excited: [
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
            ],
            sad: [
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
            ],
            angry: [
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
            ],
            playful: [
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
            ],
            focused: [
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
            ],
            default: [
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
                'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
            ]
        };
    }

    async getGif(category = 'default', mood = null) {
        try {
            // Determine the category based on mood if provided
            let gifCategory = category;
            if (mood && this.gifCategories[mood]) {
                gifCategory = mood;
            }

            // Get available GIFs for the category
            const availableGifs = this.gifCategories[gifCategory] || this.gifCategories.default;
            
            // Get recently used GIFs for this category
            const recentlyUsed = this.lastUsedGifs.get(gifCategory) || [];
            
            // Filter out recently used GIFs
            const unusedGifs = availableGifs.filter(gif => !recentlyUsed.includes(gif));
            
            // If all GIFs have been used recently, reset the recently used list
            let selectedGif;
            if (unusedGifs.length === 0) {
                selectedGif = availableGifs[Math.floor(Math.random() * availableGifs.length)];
                this.lastUsedGifs.set(gifCategory, []);
            } else {
                selectedGif = unusedGifs[Math.floor(Math.random() * unusedGifs.length)];
            }
            
            // Add the selected GIF to recently used
            const updatedRecentlyUsed = [...recentlyUsed, selectedGif];
            if (updatedRecentlyUsed.length > 3) {
                updatedRecentlyUsed.shift(); // Remove oldest
            }
            this.lastUsedGifs.set(gifCategory, updatedRecentlyUsed);
            
            return selectedGif;
        } catch (error) {
            console.error('Error getting GIF:', error);
            // Return a fallback GIF
            return 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif';
        }
    }

    async searchGif(query) {
        try {
            // This would integrate with a GIF API like Giphy
            // For now, return a placeholder
            return `🎬 I'd love to search for a GIF of "${query}" for you, but my GIF search is still cooking rn! 🔥`;
        } catch (error) {
            console.error('Error searching GIF:', error);
            return null;
        }
    }

    getRandomEmoji() {
        const emojis = [
            '😊', '🔥', '💯', '😎', '🤔', '😅', '😂', '😍', '🥰', '😘',
            '🤗', '🤩', '😇', '🤠', '👻', '🤖', '👾', '🎮', '🎯', '🎪',
            '🎨', '🎭', '🎪', '🎟️', '🎫', '🎬', '🎤', '🎧', '🎼', '🎹',
            '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '🧩', '🎯', '🎳',
            '🎮', '🎰', '🎲', '🧩', '🎯', '🎳', '🎮', '🎰', '🎲', '🧩'
        ];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }

    getMoodEmoji(mood) {
        const moodEmojis = {
            happy: ['😊', '😄', '😁', '🥰', '😍'],
            excited: ['🔥', '🚀', '💪', '😎', '🤩'],
            sad: ['😔', '😢', '😭', '💔', '🥺'],
            angry: ['😤', '😡', '🤬', '💢', '😠'],
            playful: ['😏', '😋', '🤪', '😜', '🤓'],
            focused: ['🎯', '🧠', '🤔', '🤓', '💭'],
            tired: ['😴', '🥱', '😪', '💤', '😵'],
            calm: ['😌', '🧘‍♂️', '🌊', '🌸', '🍃']
        };
        
        const emojis = moodEmojis[mood] || moodEmojis.happy;
        return emojis[Math.floor(Math.random() * emojis.length)];
    }

    async getReactionEmoji(context) {
        const contextEmojis = {
            greeting: ['👋', '🤗', '😊', '🙌'],
            farewell: ['👋', '👋', '😊', '🙏'],
            agreement: ['👍', '💯', '🔥', '✅'],
            disagreement: ['👎', '🤔', '😅', '❌'],
            surprise: ['😱', '🤯', '😲', '😳'],
            laughter: ['😂', '🤣', '😆', '😅'],
            love: ['🥰', '😍', '💕', '❤️'],
            anger: ['😤', '😡', '💢', '🤬'],
            sadness: ['😔', '😢', '💔', '🥺'],
            excitement: ['🔥', '🚀', '💪', '😎']
        };
        
        const emojis = contextEmojis[context] || contextEmojis.greeting;
        return emojis[Math.floor(Math.random() * emojis.length)];
    }
}

module.exports = { GifManager };