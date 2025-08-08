const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['h', 'commands', 'zolory'],
    description: 'Shows all available commands and features',
    async execute(message, args) {
        const { client } = message;
        const embed = new EmbedBuilder()
            .setTitle(`🤖 ${client.config.botPersonality.name} - Your AI Assistant`)
            .setColor('#00ff00')
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(`Yo ${message.author.displayName}! I'm **${client.config.botPersonality.name}**, your 19-year-old Mexican + Latino + Da Hoodian + Puerto Rican AI assistant! 🔥\n\nI speak **24 languages**, have **emotions**, and can help with **everything**! Here's what I can do:`)
            .addFields(
                {
                    name: '🎮 **Games**',
                    value: '`tictactoe` - Play Tic-Tac-Toe\n`hangman` - Play Hangman\n`trivia` - Test your knowledge\n`rps` - Rock, Paper, Scissors',
                    inline: true
                },
                {
                    name: '🛡️ **Moderation**',
                    value: '`ban` - Ban a member\n`kick` - Kick a member\n`timeout` - Timeout a member\n`warn` - Warn a member\n`mute` - Mute a member',
                    inline: true
                },
                {
                    name: '🤖 **AI Features**',
                    value: '`code` - Generate code\n`story` - Write stories\n`translate` - Translate text\n`math` - Solve math problems\n`image` - Generate images',
                    inline: true
                },
                {
                    name: '😴 **Sleep & Mood**',
                    value: '`sleep nap` - Take a nap\n`sleep wake` - Wake up\n`sleep status` - Check sleep status\n`mood` - Check my mood',
                    inline: true
                },
                {
                    name: '🎯 **Fun Stuff**',
                    value: '`bet` - Make a bet\n`dare` - Give a dare\n`roast` - Roast someone\n`compliment` - Compliment someone',
                    inline: true
                },
                {
                    name: '🔧 **Utility**',
                    value: '`ping` - Check latency\n`info` - Bot information\n`stats` - My statistics\n`help` - This menu',
                    inline: true
                }
            )
            .addFields(
                {
                    name: '💬 **Natural Language**',
                    value: 'Just mention me or say my name! I can understand natural language commands like:\n• "Yo Zolory, ban user123 for 1h because spam"\n• "Zolory, let\'s play tictactoe"\n• "Zolory, write me a story"\n• "Zolory, translate hello to Spanish"',
                    inline: false
                },
                {
                    name: '😊 **My Personality**',
                    value: `**Age:** ${client.config.botPersonality.age}\n**Ethnicity:** ${client.config.botPersonality.ethnicity}\n**Accent:** ${client.config.botPersonality.accent}\n**Languages:** ${client.config.botPersonality.languages.length}\n**Current Mood:** ${client.botState.currentMood}`,
                    inline: false
                }
            )
            .setFooter({ text: `Owner: ${client.config.ownerName} | Made with ❤️ by Zap` })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};