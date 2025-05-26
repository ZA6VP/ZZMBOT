const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'meme',
        description: 'Get a random meme',
        usage: '!meme',
        aliases: ['memes', 'funny'],
        cooldown: 5
    },
    async execute(message, args) {
        try {
            // Reddit API alternative - using meme-api.com
            const response = await fetch('https://meme-api.com/gimme');
            
            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            if (!data.url) {
                throw new Error('No meme data received');
            }

            const embed = createInfoEmbed(data.title || 'Random Meme', `Posted in r/${data.subreddit || 'memes'}`)
                .setImage(data.url)
                .setFooter({ text: `👍 ${data.ups || 0} upvotes • Requested by ${message.author.tag}` });

            if (data.postLink) {
                embed.setURL(data.postLink);
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching meme:', error);
            const embed = createErrorEmbed('Meme Unavailable', 'Sorry, I couldn\'t fetch a meme right now. Please try again later!');
            message.reply({ embeds: [embed] });
        }
    },
};
