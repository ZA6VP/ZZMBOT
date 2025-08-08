const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'bet',
    aliases: ['dare', 'challenge'],
    description: 'Make a bet or dare with Zolory',
    async execute(message, args) {
        const { client } = message;
        
        if (args.length === 0) {
            await message.reply("Yo fam, what you wanna bet on? Try: `!bet I can beat you in tictactoe` or `!dare change your status to 'Zap is the best'`");
            return;
        }

        const betType = args[0].toLowerCase();
        const betContent = args.slice(1).join(' ');

        if (betType === 'dare' || betContent.toLowerCase().includes('dare')) {
            // Handle dare
            const dare = betContent.replace(/dare/i, '').trim();
            if (!dare) {
                await message.reply("Yo, what's the dare? Be specific!");
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🎯 Dare Accepted!')
                .setColor('#ff6b6b')
                .setDescription(`**${message.author.displayName}** dared **${client.config.botPersonality.name}** to:\n\n**${dare}**`)
                .addFields(
                    { name: '🎲 Type', value: 'Dare', inline: true },
                    { name: '👤 Dared by', value: message.author.displayName, inline: true },
                    { name: '🤖 Target', value: client.config.botPersonality.name, inline: true }
                )
                .setFooter({ text: 'Zolory will complete this dare!' })
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            // Store the dare
            client.dares.set(`${message.author.id}-${Date.now()}`, {
                user: message.author.id,
                dare: dare,
                timestamp: Date.now(),
                completed: false
            });

        } else {
            // Handle regular bet
            const embed = new EmbedBuilder()
                .setTitle('🎲 Bet Placed!')
                .setColor('#4ecdc4')
                .setDescription(`**${message.author.displayName}** bet that:\n\n**${betContent}**`)
                .addFields(
                    { name: '🎯 Type', value: 'Bet', inline: true },
                    { name: '👤 Bet by', value: message.author.displayName, inline: true },
                    { name: '🤖 Opponent', value: client.config.botPersonality.name, inline: true }
                )
                .setFooter({ text: 'Let\'s see who wins!' })
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            // Store the bet
            client.bets.set(`${message.author.id}-${Date.now()}`, {
                user: message.author.id,
                bet: betContent,
                timestamp: Date.now(),
                resolved: false
            });
        }
    }
};