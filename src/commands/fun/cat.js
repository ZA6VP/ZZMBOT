const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'cat',
        description: 'Get a random cat picture',
        usage: '!cat',
        aliases: ['kitty', 'kitten'],
        cooldown: 3
    },
    async execute(message, args) {
        try {
            // Using The Cat API
            const response = await fetch('https://api.thecatapi.com/v1/images/search');
            
            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            if (!data[0] || !data[0].url) {
                throw new Error('No cat image received');
            }

            const embed = createInfoEmbed('🐱 Random Cat', 'Here\'s a cute cat for you!')
                .setImage(data[0].url)
                .setColor('#FF69B4')
                .setFooter({ text: `Requested by ${message.author.tag} • Powered by TheCatAPI` });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching cat image:', error);
            const embed = createErrorEmbed('Cat Unavailable', 'Sorry, I couldn\'t fetch a cat picture right now. Please try again later! 🐱');
            message.reply({ embeds: [embed] });
        }
    },
};
