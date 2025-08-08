const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'translate',
    aliases: ['tr', 'lang'],
    description: 'Translate text between languages',
    async execute(message, args) {
        const { client } = message;
        
        if (args.length < 2) {
            await message.reply("Yo fam, I need a language and text! Try: `!translate spanish hello world`");
            return;
        }

        const targetLanguage = args[0].toLowerCase();
        const text = args.slice(1).join(' ');

        // Show typing indicator
        const typingMessage = await message.reply('🌍 **Zolory is translating...** Please wait!');

        try {
            const translation = await client.zoloryAI.translateText(text, targetLanguage);
            
            const embed = new EmbedBuilder()
                .setTitle(`🌍 Translation - ${targetLanguage.toUpperCase()}`)
                .setColor('#00ff00')
                .addFields(
                    { name: '📝 Original Text', value: text, inline: false },
                    { name: '🔄 Translated Text', value: translation, inline: false },
                    { name: '🌐 Target Language', value: targetLanguage.toUpperCase(), inline: true },
                    { name: '🤖 Translated by', value: client.config.botPersonality.name, inline: true }
                )
                .setFooter({ text: `Requested by ${message.author.tag}` })
                .setTimestamp();

            await typingMessage.edit({ content: null, embeds: [embed] });

        } catch (error) {
            console.error('Error translating text:', error);
            await typingMessage.edit("Yo, my brain's lagging rn! I couldn't translate that! 😅");
        }
    }
};