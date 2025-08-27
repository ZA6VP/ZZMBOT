const fetch = require('node-fetch');

module.exports = {
    name: 'dog',
    aliases: ['doggo', 'puppy', 'woof'],
    description: 'Get a random dog picture',
    usage: '!dog',
    category: 'fun',
    cooldown: 5,
    
    async execute(message, args, client) {
        try {
            const response = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await response.json();
            
            if (!data || data.status !== 'success') {
                return message.reply('❌ Could not fetch a dog picture. Please try again.');
            }
            
            const dogEmbed = {
                color: 0x8b4513,
                title: '🐕 Random Dog',
                image: {
                    url: data.message
                },
                footer: { text: `Requested by ${message.author.tag}` },
                timestamp: new Date()
            };
            
            message.reply({ embeds: [dogEmbed] });
            
        } catch (error) {
            console.error('Dog fetch error:', error);
            message.reply('❌ An error occurred while fetching a dog picture. Please try again later.');
        }
    }
};