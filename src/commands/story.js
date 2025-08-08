const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'story',
    aliases: ['write', 'tale'],
    description: 'Generate creative stories',
    async execute(message, args) {
        const { client } = message;
        
        if (args.length === 0) {
            await message.reply("Yo fam, I need a genre and maybe a length! Try: `!story fantasy short` or `!story sci-fi long`");
            return;
        }

        const genre = args[0].toLowerCase();
        const length = args[1]?.toLowerCase() || 'short';

        // Show typing indicator
        const typingMessage = await message.reply('📝 **Zolory is writing a story...** Please wait!');

        try {
            const story = await client.zoloryAI.generateStory(genre, length);
            
            const embed = new EmbedBuilder()
                .setTitle(`📚 Story Generated - ${genre.toUpperCase()}`)
                .setColor('#00ff00')
                .setDescription(story)
                .addFields(
                    { name: '📖 Genre', value: genre.toUpperCase(), inline: true },
                    { name: '📏 Length', value: length.toUpperCase(), inline: true },
                    { name: '✍️ Written by', value: client.config.botPersonality.name, inline: true }
                )
                .setFooter({ text: `Requested by ${message.author.tag}` })
                .setTimestamp();

            await typingMessage.edit({ content: null, embeds: [embed] });

        } catch (error) {
            console.error('Error generating story:', error);
            await typingMessage.edit("Yo, my brain's lagging rn! I couldn't write that story! 😅");
        }
    }
};