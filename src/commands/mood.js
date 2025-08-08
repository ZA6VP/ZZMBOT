const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'mood',
    aliases: ['emotion', 'feeling'],
    description: 'Check or change Zolory\'s mood',
    async execute(message, args) {
        const { client } = message;
        
        if (args.length === 0) {
            // Show current mood
            const mood = client.botState.currentMood;
            const emoji = client.gifManager.getMoodEmoji(mood);
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji} Zolory's Current Mood`)
                .setColor('#00ff00')
                .setDescription(`**${mood.toUpperCase()}**`)
                .addFields(
                    { name: '😊 Mood', value: mood, inline: true },
                    { name: '⏰ Last Change', value: formatTime(client.emotionManager.lastMoodChange), inline: true },
                    { name: '🎯 Intensity', value: `${Math.round(client.emotionManager.moodIntensity * 100)}%`, inline: true }
                )
                .setFooter({ text: `Requested by ${message.author.tag}` })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } else {
            // Change mood (owner only)
            if (message.author.id !== client.config.ownerId) {
                await message.reply("Yo, only my owner can change my mood! 😤");
                return;
            }

            const newMood = args[0].toLowerCase();
            if (client.config.botPersonality.moods.includes(newMood)) {
                client.emotionManager.setMood(newMood);
                client.botState.currentMood = newMood;
                
                const emoji = client.gifManager.getMoodEmoji(newMood);
                await message.reply(`${emoji} **Mood changed to: ${newMood.toUpperCase()}**`);
            } else {
                const validMoods = client.config.botPersonality.moods.join(', ');
                await message.reply(`Yo, that's not a valid mood! Try: ${validMoods}`);
            }
        }
    }
};

function formatTime(timestamp) {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}