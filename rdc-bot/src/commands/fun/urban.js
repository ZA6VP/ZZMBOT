const fetch = require('node-fetch');

module.exports = {
    name: 'urban',
    aliases: ['ud', 'urbandictionary', 'define'],
    description: 'Look up a term on Urban Dictionary',
    usage: '!urban <term>',
    category: 'fun',
    cooldown: 5,
    
    async execute(message, args, client) {
        if (!args[0]) {
            return message.reply('❌ Please provide a term to look up.');
        }
        
        const term = args.join(' ');
        
        try {
            const response = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
            const data = await response.json();
            
            if (!data.list || data.list.length === 0) {
                return message.reply(`❌ No definition found for **${term}**.`);
            }
            
            // Get the top definition
            const definition = data.list[0];
            
            // Clean up the definition text
            let defText = definition.definition.replace(/\[/g, '').replace(/\]/g, '');
            let exampleText = definition.example.replace(/\[/g, '').replace(/\]/g, '');
            
            // Truncate if too long
            if (defText.length > 1024) {
                defText = defText.substring(0, 1021) + '...';
            }
            if (exampleText.length > 1024) {
                exampleText = exampleText.substring(0, 1021) + '...';
            }
            
            const urbanEmbed = {
                color: 0x134fe6,
                title: `📖 Urban Dictionary: ${definition.word}`,
                url: definition.permalink,
                fields: [
                    {
                        name: 'Definition',
                        value: defText || 'No definition',
                        inline: false
                    }
                ],
                footer: {
                    text: `👍 ${definition.thumbs_up} | 👎 ${definition.thumbs_down} | By ${definition.author}`,
                    icon_url: 'https://www.urbandictionary.com/favicon.ico'
                },
                timestamp: new Date(definition.written_on)
            };
            
            // Add example if exists
            if (exampleText && exampleText !== '') {
                urbanEmbed.fields.push({
                    name: 'Example',
                    value: `*${exampleText}*`,
                    inline: false
                });
            }
            
            // Check if NSFW
            if (!message.channel.nsfw) {
                urbanEmbed.description = '⚠️ Some Urban Dictionary content may be NSFW. Use in NSFW channels for unrestricted results.';
            }
            
            message.reply({ embeds: [urbanEmbed] });
            
        } catch (error) {
            console.error('Urban Dictionary error:', error);
            message.reply('❌ An error occurred while looking up the term. Please try again later.');
        }
    }
};