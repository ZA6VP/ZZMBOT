const fetch = require('node-fetch');

module.exports = {
    name: 'meme',
    aliases: ['reddit', 'dankmeme'],
    description: 'Get a random meme from Reddit',
    usage: '!meme',
    category: 'fun',
    cooldown: 5,
    
    async execute(message, args, client) {
        const subreddits = ['memes', 'dankmemes', 'wholesomememes', 'me_irl', 'meme'];
        const randomSubreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
        
        try {
            const response = await fetch(`https://www.reddit.com/r/${randomSubreddit}/random/.json`);
            const data = await response.json();
            
            if (!data || !data[0] || !data[0].data || !data[0].data.children || !data[0].data.children[0]) {
                return message.reply('❌ Could not fetch a meme. Please try again.');
            }
            
            const post = data[0].data.children[0].data;
            
            // Filter out NSFW content
            if (post.over_18 && !message.channel.nsfw) {
                return message.reply('❌ NSFW content can only be shown in NSFW channels.');
            }
            
            // Create embed
            const memeEmbed = {
                color: 0xff4500,
                title: post.title.length > 256 ? post.title.substring(0, 253) + '...' : post.title,
                url: `https://reddit.com${post.permalink}`,
                image: {
                    url: post.url
                },
                footer: {
                    text: `👍 ${post.ups} | 💬 ${post.num_comments} | r/${randomSubreddit}`,
                    icon_url: 'https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png'
                },
                timestamp: new Date()
            };
            
            // Add author if available
            if (post.author) {
                memeEmbed.author = {
                    name: `u/${post.author}`,
                    url: `https://reddit.com/u/${post.author}`
                };
            }
            
            message.reply({ embeds: [memeEmbed] });
            
        } catch (error) {
            console.error('Meme fetch error:', error);
            message.reply('❌ An error occurred while fetching a meme. Please try again later.');
        }
    }
};