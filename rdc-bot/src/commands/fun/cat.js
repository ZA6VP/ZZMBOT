const fetch = require('node-fetch');

module.exports = {
    name: 'cat',
    aliases: ['kitty', 'meow'],
    description: 'Get a random cat picture',
    usage: '!cat',
    category: 'fun',
    cooldown: 5,
    
    async execute(message, args, client) {
        try {
            const response = await fetch('https://api.thecatapi.com/v1/images/search');
            const data = await response.json();
            
            if (!data || !data[0]) {
                return message.reply('❌ Could not fetch a cat picture. Please try again.');
            }
            
            const catEmbed = {
                color: 0xff69b4,
                title: '🐱 Random Cat',
                image: {
                    url: data[0].url
                },
                footer: { text: `Requested by ${message.author.tag}` },
                timestamp: new Date()
            };
            
            message.reply({ embeds: [catEmbed] });
            
        } catch (error) {
            console.error('Cat fetch error:', error);
            message.reply('❌ An error occurred while fetching a cat picture. Please try again later.');
        }
    }
};