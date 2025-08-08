const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'math',
    aliases: ['calculate', 'solve'],
    description: 'Solve mathematical problems',
    async execute(message, args) {
        const { client } = message;
        
        if (args.length === 0) {
            await message.reply("Yo fam, I need a math problem! Try: `!math 2 + 2` or `!math solve for x: 3x + 5 = 20`");
            return;
        }

        const problem = args.join(' ');

        // Show typing indicator
        const typingMessage = await message.reply('🧮 **Zolory is solving...** Please wait!');

        try {
            const solution = await client.zoloryAI.solveMath(problem);
            
            const embed = new EmbedBuilder()
                .setTitle(`🧮 Math Solution`)
                .setColor('#00ff00')
                .addFields(
                    { name: '📝 Problem', value: problem, inline: false },
                    { name: '✅ Solution', value: solution, inline: false },
                    { name: '🤖 Solved by', value: client.config.botPersonality.name, inline: true }
                )
                .setFooter({ text: `Requested by ${message.author.tag}` })
                .setTimestamp();

            await typingMessage.edit({ content: null, embeds: [embed] });

        } catch (error) {
            console.error('Error solving math problem:', error);
            await typingMessage.edit("Yo, my brain's lagging rn! I couldn't solve that math problem! 😅");
        }
    }
};