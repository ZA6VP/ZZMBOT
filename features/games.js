const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

class GameSystem {
    constructor() {
        this.activeGames = new Map();
    }

    // Rock Paper Scissors
    async startRPS(message) {
        const gameId = `rps_${message.author.id}_${Date.now()}`;
        
        const embed = new EmbedBuilder()
            .setTitle('🪨📄✂️ Rock Paper Scissors!')
            .setDescription(`${message.author.displayName} vs Zolory\nChoose your weapon!`)
            .setColor('#ff6b6b');

        const buttons = [
            new ButtonBuilder()
                .setCustomId(`rps_${gameId}_rock`)
                .setLabel('🪨 Rock')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`rps_${gameId}_paper`)
                .setLabel('📄 Paper')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`rps_${gameId}_scissors`)
                .setLabel('✂️ Scissors')
                .setStyle(ButtonStyle.Primary)
        ];

        const row = new ActionRowBuilder().addComponents(buttons);
        await message.reply({ embeds: [embed], components: [row] });
        return gameId;
    }

    async handleRPS(interaction) {
        const [,, choice] = interaction.customId.split('_');
        const choices = ['rock', 'paper', 'scissors'];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        
        const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
        const result = this.getRPSResult(choice, botChoice);
        
        let resultText = '';
        let color = '';
        
        switch (result) {
            case 'win':
                resultText = `You won! 😤 Lucky shot bro`;
                color = '#00ff00';
                break;
            case 'lose':
                resultText = `I won! 😎 Better luck next time`;
                color = '#ff0000';
                break;
            case 'tie':
                resultText = `It's a tie! 🤝 Great minds think alike`;
                color = '#ffff00';
                break;
        }

        const embed = new EmbedBuilder()
            .setTitle('🪨📄✂️ Rock Paper Scissors Result!')
            .setDescription(`You: ${emojis[choice]}\nMe: ${emojis[botChoice]}\n\n${resultText}`)
            .setColor(color);

        await interaction.update({ embeds: [embed], components: [] });
    }

    getRPSResult(player, bot) {
        if (player === bot) return 'tie';
        if (
            (player === 'rock' && bot === 'scissors') ||
            (player === 'paper' && bot === 'rock') ||
            (player === 'scissors' && bot === 'paper')
        ) {
            return 'win';
        }
        return 'lose';
    }

    // Simple Trivia
    async startTrivia(message) {
        const questions = [
            {
                question: "What programming language is Discord.js written in?",
                answers: ["JavaScript", "Python", "Java", "C++"],
                correct: 0
            },
            {
                question: "What does 'API' stand for?",
                answers: ["Application Programming Interface", "Advanced Programming Integration", "Automated Program Instructions", "Application Process Integration"],
                correct: 0
            },
            {
                question: "Which company owns Discord?",
                answers: ["Microsoft", "Google", "Discord Inc.", "Meta"],
                correct: 2
            },
            {
                question: "What year was JavaScript created?",
                answers: ["1993", "1995", "1997", "1999"],
                correct: 1
            },
            {
                question: "What does 'HTTP' stand for?",
                answers: ["HyperText Transfer Protocol", "High Tech Transfer Process", "Home Tool Transfer Program", "HyperTech Transfer Protocol"],
                correct: 0
            }
        ];

        const question = questions[Math.floor(Math.random() * questions.length)];
        const gameId = `trivia_${message.author.id}_${Date.now()}`;
        
        this.activeGames.set(gameId, {
            type: 'trivia',
            question: question,
            player: message.author.id
        });

        const embed = new EmbedBuilder()
            .setTitle('🧠 Trivia Time!')
            .setDescription(`**${question.question}**`)
            .setColor('#4ecdc4');

        const buttons = question.answers.map((answer, index) =>
            new ButtonBuilder()
                .setCustomId(`trivia_${gameId}_${index}`)
                .setLabel(answer)
                .setStyle(ButtonStyle.Secondary)
        );

        const rows = [
            new ActionRowBuilder().addComponents(buttons.slice(0, 2)),
            new ActionRowBuilder().addComponents(buttons.slice(2, 4))
        ];

        await message.reply({ embeds: [embed], components: rows });
        return gameId;
    }

    async handleTrivia(interaction) {
        const [, gameId, answerIndex] = interaction.customId.split('_');
        const game = this.activeGames.get(gameId);
        
        if (!game || game.player !== interaction.user.id) {
            return await interaction.reply({ content: "This isn't your trivia! 😤", ephemeral: true });
        }

        const isCorrect = parseInt(answerIndex) === game.question.correct;
        const correctAnswer = game.question.answers[game.question.correct];

        const embed = new EmbedBuilder()
            .setTitle('🧠 Trivia Result!')
            .setDescription(
                isCorrect 
                    ? `✅ Correct! Nice one bro! 😎\n\n**Answer:** ${correctAnswer}`
                    : `❌ Wrong! The correct answer was: **${correctAnswer}**\n\nDon't worry, you'll get it next time! 💪`
            )
            .setColor(isCorrect ? '#00ff00' : '#ff0000');

        await interaction.update({ embeds: [embed], components: [] });
        this.activeGames.delete(gameId);
    }

    // Number Guessing Game
    async startNumberGuess(message, range = 100) {
        const number = Math.floor(Math.random() * range) + 1;
        const gameId = `guess_${message.author.id}_${Date.now()}`;
        
        this.activeGames.set(gameId, {
            type: 'guess',
            number: number,
            attempts: 0,
            maxAttempts: Math.ceil(Math.log2(range)) + 2,
            range: range,
            player: message.author.id
        });

        const embed = new EmbedBuilder()
            .setTitle('🎯 Number Guessing Game!')
            .setDescription(`I'm thinking of a number between 1 and ${range}!\nYou have ${Math.ceil(Math.log2(range)) + 2} attempts. Just type your guess!`)
            .setColor('#9b59b6');

        await message.reply({ embeds: [embed] });
        return gameId;
    }

    async handleNumberGuess(message, guess) {
        const games = Array.from(this.activeGames.values()).filter(
            game => game.type === 'guess' && game.player === message.author.id
        );
        
        if (games.length === 0) return false;
        
        const game = games[0];
        const gameId = Array.from(this.activeGames.keys()).find(
            key => this.activeGames.get(key) === game
        );
        
        const guessNum = parseInt(guess);
        if (isNaN(guessNum) || guessNum < 1 || guessNum > game.range) {
            await message.reply(`Yo, that's not a valid number! Pick between 1 and ${game.range}! 🙄`);
            return true;
        }

        game.attempts++;

        if (guessNum === game.number) {
            const embed = new EmbedBuilder()
                .setTitle('🎯 You Got It!')
                .setDescription(`🎉 YES! The number was ${game.number}!\nYou got it in ${game.attempts} attempts! GG bro! 😎`)
                .setColor('#00ff00');
            
            await message.reply({ embeds: [embed] });
            this.activeGames.delete(gameId);
        } else if (game.attempts >= game.maxAttempts) {
            const embed = new EmbedBuilder()
                .setTitle('🎯 Game Over!')
                .setDescription(`😅 You ran out of attempts! The number was ${game.number}.\nBetter luck next time bro! 💪`)
                .setColor('#ff0000');
            
            await message.reply({ embeds: [embed] });
            this.activeGames.delete(gameId);
        } else {
            const hint = guessNum > game.number ? 'lower' : 'higher';
            const remaining = game.maxAttempts - game.attempts;
            
            const embed = new EmbedBuilder()
                .setTitle('🎯 Keep Trying!')
                .setDescription(`${guessNum > game.number ? '📉' : '📈'} Go ${hint}!\nAttempts left: ${remaining}`)
                .setColor('#ffa500');
            
            await message.reply({ embeds: [embed] });
        }
        
        return true;
    }

    // Dice Roll
    async rollDice(message, sides = 6, count = 1) {
        if (count > 10) count = 10; // Limit to prevent spam
        if (sides > 100) sides = 100; // Reasonable limit
        
        const rolls = [];
        let total = 0;
        
        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            total += roll;
        }

        const embed = new EmbedBuilder()
            .setTitle('🎲 Dice Roll!')
            .setDescription(
                count === 1 
                    ? `You rolled a **${rolls[0]}** on a d${sides}! 🎲`
                    : `Rolling ${count}d${sides}:\n**Rolls:** ${rolls.join(', ')}\n**Total:** ${total}`
            )
            .setColor('#e74c3c');

        await message.reply({ embeds: [embed] });
    }

    // Coin Flip
    async flipCoin(message) {
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const emoji = result === 'heads' ? '🟡' : '⚫';
        
        const responses = {
            heads: [
                "It's heads! 🟡 You called it!",
                "Heads it is! 🟡 Lucky guess bro!",
                "🟡 Heads! Nice prediction!"
            ],
            tails: [
                "It's tails! ⚫ Better luck next time!",
                "Tails! ⚫ The coin has spoken!",
                "⚫ Tails it is! Maybe next flip!"
            ]
        };

        const embed = new EmbedBuilder()
            .setTitle('🪙 Coin Flip!')
            .setDescription(`${emoji} **${result.toUpperCase()}**\n\n${responses[result][Math.floor(Math.random() * responses[result].length)]}`)
            .setColor(result === 'heads' ? '#f1c40f' : '#34495e');

        await message.reply({ embeds: [embed] });
    }
}

module.exports = GameSystem;