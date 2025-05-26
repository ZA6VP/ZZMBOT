const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'dog',
        description: 'Get a random dog picture',
        usage: '!dog',
        aliases: ['doggo', 'puppy'],
        cooldown: 3
    },
    async execute(message, args) {
        try {
            // Using The Dog API
            const response = await fetch('https://api.thedogapi.com/v1/images/search');
            
            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            if (!data[0] || !data[0].url) {
                throw new Error('No dog image received');
            }

            const embed = createInfoEmbed('🐶 Random Dog', 'Here\'s a cute dog for you!')
                .setImage(data[0].url)
                .setColor('#8B4513')
                .setFooter({ text: `Requested by ${message.author.tag} • Powered by TheDogAPI` });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching dog image:', error);
            const embed = createErrorEmbed('Dog Unavailable', 'Sorry, I couldn\'t fetch a dog picture right now. Please try again later! 🐶');
            message.reply({ embeds: [embed] });
        }
    },
};
