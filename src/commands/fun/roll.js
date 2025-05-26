const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'roll',
        description: 'Roll a dice',
        usage: '!roll [sides]',
        aliases: ['dice', 'random'],
        cooldown: 2
    },
    async execute(message, args) {
        try {
            // Get number of sides (default 6)
            let sides = parseInt(args[0]) || 6;
            
            // Validate sides
            if (sides < 2) {
                sides = 6;
            } else if (sides > 1000) {
                const embed = createErrorEmbed('Invalid Dice', 'Please use a dice with 1000 sides or fewer.');
                return message.reply({ embeds: [embed] });
            }

            // Roll the dice
            const result = Math.floor(Math.random() * sides) + 1;

            // Create different responses based on result
            let emoji = '🎲';
            let color = '#0099FF';
            let resultText = '';

            if (sides === 6) {
                // Special handling for standard dice
                const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                emoji = diceEmojis[result - 1];
                
                if (result === 6) {
                    resultText = 'Perfect roll! 🎉';
                    color = '#00FF00';
                } else if (result === 1) {
                    resultText = 'Better luck next time! 😅';
                    color = '#FF6B35';
                }
            } else {
                // Special messages for other dice types
                if (result === sides) {
                    resultText = `Maximum roll! 🎉`;
                    color = '#00FF00';
                } else if (result === 1) {
                    resultText = 'Minimum roll! 😅';
                    color = '#FF6B35';
                } else if (result >= sides * 0.8) {
                    resultText = 'Great roll! 👍';
                    color = '#90EE90';
                } else if (result <= sides * 0.2) {
                    resultText = 'Low roll! 👎';
                    color = '#FFA500';
                }
            }

            const embed = createInfoEmbed(`${emoji} Dice Roll`, 
                `**You rolled:** ${result}\n**Dice:** d${sides} (1-${sides})\n\n${resultText}`
            )
            .setColor(color)
            .setFooter({ text: `Rolled by ${message.author.tag}` });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in roll command:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while rolling the dice.');
            message.reply({ embeds: [embed] });
        }
    },
};
