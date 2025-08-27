const fetch = require('node-fetch');
const { decode } = require('html-entities');

module.exports = {
    name: 'trivia',
    aliases: ['quiz', 'question'],
    description: 'Start a trivia question',
    usage: '!trivia',
    category: 'fun',
    cooldown: 10,
    
    async execute(message, args, client) {
        try {
            // Fetch trivia question
            const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                return message.reply('❌ Could not fetch a trivia question. Please try again.');
            }
            
            const question = data.results[0];
            
            // Decode HTML entities
            const decodedQuestion = decode(question.question);
            const correctAnswer = decode(question.correct_answer);
            const incorrectAnswers = question.incorrect_answers.map(ans => decode(ans));
            
            // Shuffle answers
            const allAnswers = [correctAnswer, ...incorrectAnswers];
            const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);
            
            // Create answer options
            const answerOptions = shuffledAnswers.map((ans, index) => 
                `${['🇦', '🇧', '🇨', '🇩'][index]} ${ans}`
            ).join('\n');
            
            // Determine color based on difficulty
            const difficultyColors = {
                easy: 0x00ff00,
                medium: 0xffff00,
                hard: 0xff0000
            };
            
            // Create embed
            const triviaEmbed = {
                color: difficultyColors[question.difficulty] || 0x0099ff,
                title: '🧠 Trivia Question',
                description: decodedQuestion,
                fields: [
                    {
                        name: 'Category',
                        value: decode(question.category),
                        inline: true
                    },
                    {
                        name: 'Difficulty',
                        value: question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1),
                        inline: true
                    },
                    {
                        name: 'Answers',
                        value: answerOptions,
                        inline: false
                    }
                ],
                footer: { text: 'You have 30 seconds to answer!' },
                timestamp: new Date()
            };
            
            const triviaMessage = await message.reply({ embeds: [triviaEmbed] });
            
            // Add reaction options
            const reactions = ['🇦', '🇧', '🇨', '🇩'];
            for (const reaction of reactions) {
                await triviaMessage.react(reaction);
            }
            
            // Create reaction collector
            const filter = (reaction, user) => {
                return reactions.includes(reaction.emoji.name) && !user.bot;
            };
            
            const collector = triviaMessage.createReactionCollector({ 
                filter, 
                time: 30000,
                max: 10
            });
            
            const answered = new Set();
            const correctUsers = [];
            
            collector.on('collect', (reaction, user) => {
                if (answered.has(user.id)) return;
                answered.add(user.id);
                
                const answerIndex = reactions.indexOf(reaction.emoji.name);
                if (shuffledAnswers[answerIndex] === correctAnswer) {
                    correctUsers.push(user);
                }
            });
            
            collector.on('end', () => {
                // Find correct answer index
                const correctIndex = shuffledAnswers.indexOf(correctAnswer);
                const correctEmoji = reactions[correctIndex];
                
                // Update embed with results
                const resultsEmbed = {
                    ...triviaEmbed,
                    color: 0x00ff00,
                    title: '🧠 Trivia Results',
                    fields: [
                        ...triviaEmbed.fields,
                        {
                            name: 'Correct Answer',
                            value: `${correctEmoji} ${correctAnswer}`,
                            inline: false
                        }
                    ],
                    footer: { text: 'Time\'s up!' }
                };
                
                if (correctUsers.length > 0) {
                    resultsEmbed.fields.push({
                        name: '✅ Correct Answers',
                        value: correctUsers.slice(0, 10).map(u => u.toString()).join(', ') + 
                               (correctUsers.length > 10 ? ` and ${correctUsers.length - 10} more...` : ''),
                        inline: false
                    });
                } else {
                    resultsEmbed.fields.push({
                        name: '❌ Results',
                        value: 'No one got the correct answer!',
                        inline: false
                    });
                }
                
                triviaMessage.edit({ embeds: [resultsEmbed] }).catch(() => {});
            });
            
        } catch (error) {
            console.error('Trivia error:', error);
            message.reply('❌ An error occurred while fetching a trivia question. Please try again later.');
        }
    }
};