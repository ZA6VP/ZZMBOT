const { EmbedBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'urban',
        description: 'Look up a definition on Urban Dictionary',
        usage: '!urban <term>',
        aliases: ['define', 'ud'],
        cooldown: 5
    },
    async execute(message, args) {
        if (!args.length) {
            const embed = createErrorEmbed('Invalid Usage', 'Please provide a term to look up.\nUsage: `!urban <term>`');
            return message.reply({ embeds: [embed] });
        }

        const term = args.join(' ');

        try {
            // Use a fetch request to Urban Dictionary API
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
            
            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            if (!data.list || data.list.length === 0) {
                const embed = createErrorEmbed('No Results', `No definitions found for "${term}".`);
                return message.reply({ embeds: [embed] });
            }

            // Get the top definition
            const definition = data.list[0];

            // Clean up the definition text (remove extra brackets and clean formatting)
            const cleanDefinition = definition.definition
                .replace(/\[([^\]]+)\]/g, '$1') // Remove brackets
                .substring(0, 1000); // Limit length

            const cleanExample = definition.example 
                ? definition.example.replace(/\[([^\]]+)\]/g, '$1').substring(0, 500)
                : 'No example provided';

            const embed = new EmbedBuilder()
                .setColor('#00b4d8')
                .setTitle(`📚 Urban Dictionary: ${definition.word}`)
                .setURL(definition.permalink)
                .setDescription(`**Definition:**\n${cleanDefinition}`)
                .addFields([
                    {
                        name: 'Example',
                        value: cleanExample,
                        inline: false
                    },
                    {
                        name: 'Stats',
                        value: `👍 ${definition.thumbs_up} | 👎 ${definition.thumbs_down}`,
                        inline: true
                    },
                    {
                        name: 'Author',
                        value: definition.author || 'Unknown',
                        inline: true
                    }
                ])
                .setFooter({ 
                    text: `Definition ${data.list.indexOf(definition) + 1} of ${data.list.length} • Urban Dictionary`,
                    iconURL: 'https://d2gatte9o95jao.cloudfront.net/assets/apple-touch-icon-2f29e978facd8324960a335075aa9dc8.png'
                })
                .setTimestamp();

            // Add warning for NSFW content
            if (message.channel.nsfw === false) {
                embed.addFields([{
                    name: '⚠️ Content Warning',
                    value: 'This definition may contain mature content. Use in NSFW channels for uncensored results.',
                    inline: false
                }]);
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching Urban Dictionary definition:', error);
            const embed = createErrorEmbed('API Error', 
                'Sorry, I couldn\'t fetch the definition right now. The Urban Dictionary API might be down or the term might be invalid.'
            );
            await message.reply({ embeds: [embed] });
        }
    }
};