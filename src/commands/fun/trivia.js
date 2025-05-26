const { createInfoEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embedBuilder');
const { Collection } = require('discord.js');

// Store active trivia sessions
const activeTriviaSessionsPerChannel = new Collection();

module.exports = {
    data: {
        name: 'trivia',
        description: 'Start a trivia question',
        usage: '!trivia [category]',
        aliases: ['quiz', 'question'],
        cooldown: 10
    },
    async execute(message, args) {
        try {
            // Check if there's already an active trivia in this channel
            if (activeTriviaSessionsPerChannel.has(message.channel.id)) {
                const embed = createErrorEmbed('Trivia In Progress', 'There is already an active trivia question in this channel. Please wait for it to finish.');
                return message.reply({ embeds: [embed] });
            }

            // Get category if specified
            const categoryArg = args[0]?.toLowerCase();
            const categories = {
                'general': 9,
                'books': 10,
                'film': 11,
                'music': 12,
                'tv': 14,
                'games': 15,
                'science': 17,
                'math': 19,
                'sports': 21,
                'geography': 22,
                'history': 23,
                'animals': 27
            };

            let categoryId = '';
            let categoryName = 'General Knowledge';
            
            if (categoryArg && categories[categoryArg]) {
                categoryId = `&category=${categories[categoryArg]}`;
                categoryName = categoryArg.charAt(0).toUpperCase() + categoryArg.slice(1);
            }

            // Fetch trivia question from Open Trivia Database
            const response = await fetch(`https://opentdb.com/api.php?amount=1&type=multiple${categoryId}&encode=url3986`);
            
            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            if (!data.results || data.results.length === 0) {
                throw new Error('No trivia question received');
            }

            const question = data.results[0];
            
            // Decode URL encoded strings
            const decodedQuestion = decodeURIComponent(question.question);
            const decodedCorrectAnswer = decodeURIComponent(question.correct_answer);
            const decodedIncorrectAnswers = question.incorrect_answers.map(answer => decodeURIComponent(answer));

            // Combine and shuffle answers
            const allAnswers = [...decodedIncorrectAnswers, decodedCorrectAnswer];
            const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);
            
            // Find the position of the correct answer after shuffling
            const correctIndex = shuffledAnswers.indexOf(decodedCorrectAnswer);
            const answerEmojis = ['🇦', '🇧', '🇨', '🇩'];

            // Create answer options text
            const answerOptions = shuffledAnswers.map((answer, index) => 
                `${answerEmojis[index]} ${answer}`
            ).join('\n');

            // Determine difficulty color
            const difficultyColors = {
                'easy': '#00FF00',
                'medium': '#FFAA00',
                'hard': '#FF0000'
            };
            const color = difficultyColors[question.difficulty] || '#0099FF';

            // Create trivia embed
            const triviaEmbed = createInfoEmbed('🧠 Trivia Question', 
                `**Category:** ${categoryName}\n**Difficulty:** ${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}\n\n**Question:**\n${decodedQuestion}\n\n**Options:**\n${answerOptions}`
            )
            .setColor(color)
            .setFooter({ text: 'React with the correct answer! You have 30 seconds.' });

            const triviaMessage = await message.reply({ embeds: [triviaEmbed] });

            // Add reaction options
            for (let i = 0; i < shuffledAnswers.length; i++) {
                await triviaMessage.react(answerEmojis[i]);
            }

            // Mark channel as having active trivia
            activeTriviaSessionsPerChannel.set(message.channel.id, {
                correctIndex: correctIndex,
                correctAnswer: decodedCorrectAnswer,
                difficulty: question.difficulty,
                participants: new Set(),
                startTime: Date.now()
            });

            // Set up reaction collector
            const filter = (reaction, user) => {
                return answerEmojis.includes(reaction.emoji.name) && !user.bot;
            };

            const collector = triviaMessage.createReactionCollector({ filter, time: 30000 });

            collector.on('collect', (reaction, user) => {
                const session = activeTriviaSessionsPerChannel.get(message.channel.id);
                if (session && !session.participants.has(user.id)) {
                    session.participants.add(user.id);
                    
                    const userAnswerIndex = answerEmojis.indexOf(reaction.emoji.name);
                    if (userAnswerIndex === session.correctIndex) {
                        // Correct answer - end immediately
                        collector.stop('correct');
                    }
                }
            });

            collector.on('end', async (collected, reason) => {
                const session = activeTriviaSessionsPerChannel.get(message.channel.id);
                if (!session) return;

                // Remove active session
                activeTriviaSessionsPerChannel.delete(message.channel.id);

                let resultEmbed;
                
                if (reason === 'correct') {
                    // Someone got it right
                    const winners = [];
                    for (const [emoji, users] of collected.entries()) {
                        if (answerEmojis.indexOf(emoji) === session.correctIndex) {
                            users.users.forEach(user => {
                                if (!user.bot) winners.push(user);
                            });
                        }
                    }

                    const timeTaken = Math.round((Date.now() - session.startTime) / 1000);
                    const points = session.difficulty === 'easy' ? 1 : session.difficulty === 'medium' ? 2 : 3;

                    resultEmbed = createSuccessEmbed('🎉 Trivia Complete!', 
                        `**Correct Answer:** ${session.correctAnswer}\n\n**Winners:** ${winners.map(user => user.toString()).join(', ')}\n**Time:** ${timeTaken}s\n**Points Earned:** ${points}`
                    );

                    // Award XP to winners
                    const { addXP } = require('../../utils/xpSystem');
                    for (const winner of winners) {
                        if (message.guild) {
                            await addXP(winner.id, message.guild.id, points * 10);
                        }
                    }
                } else {
                    // Time ran out
                    resultEmbed = createErrorEmbed('⏰ Time\'s Up!', 
                        `**Correct Answer:** ${session.correctAnswer}\n\nBetter luck next time! ${session.participants.size > 0 ? `${session.participants.size} people participated.` : 'No one participated.'}`
                    );
                }

                await message.channel.send({ embeds: [resultEmbed] });

                // Clear all reactions
                await triviaMessage.reactions.removeAll().catch(console.error);
            });

        } catch (error) {
            console.error('Error in trivia command:', error);
            
            // Make sure to clean up active session on error
            activeTriviaSessionsPerChannel.delete(message.channel.id);
            
            const embed = createErrorEmbed('Trivia Unavailable', 'Sorry, I couldn\'t fetch a trivia question right now. Please try again later!');
            message.reply({ embeds: [embed] });
        }
    },
};
