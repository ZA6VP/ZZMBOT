const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'stats',
    aliases: ['statistics', 'info'],
    description: 'Show Zolory\'s statistics and performance',
    async execute(message, args) {
        const { client } = message;
        
        const stats = client.botState.stats;
        const uptime = formatUptime(client.uptime);
        const memoryUsage = process.memoryUsage();
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${client.config.botPersonality.name} Statistics`)
            .setColor('#00ff00')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: '🤖 Bot Info',
                    value: `**Name:** ${client.config.botPersonality.name}\n**Age:** ${client.config.botPersonality.age}\n**Ethnicity:** ${client.config.botPersonality.ethnicity}\n**Accent:** ${client.config.botPersonality.accent}`,
                    inline: true
                },
                {
                    name: '📈 Performance',
                    value: `**Uptime:** ${uptime}\n**Messages:** ${stats.messagesProcessed}\n**Commands:** ${stats.commandsExecuted}\n**Games:** ${stats.gamesPlayed}`,
                    inline: true
                },
                {
                    name: '🎯 Current Status',
                    value: `**Mood:** ${client.botState.currentMood}\n**Awake:** ${client.botState.isAwake ? 'Yes' : 'No'}\n**Servers:** ${client.guilds.cache.size}\n**Users:** ${client.users.cache.size}`,
                    inline: true
                },
                {
                    name: '🧠 System Info',
                    value: `**Memory:** ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB\n**Node.js:** ${process.version}\n**Discord.js:** ${require('discord.js').version}\n**Platform:** ${process.platform}`,
                    inline: true
                },
                {
                    name: '🌍 Languages',
                    value: `${client.config.botPersonality.languages.length} languages supported\n**Top 5:** ${client.config.botPersonality.languages.slice(0, 5).join(', ')}`,
                    inline: true
                },
                {
                    name: '🎮 Features',
                    value: `**Games:** ${Object.keys(client.config.games).length}\n**AI:** Gemini\n**Moderation:** Enabled\n**Sleep:** ${client.config.features.sleepSchedule ? 'Enabled' : 'Disabled'}`,
                    inline: true
                }
            )
            .setFooter({ text: `Owner: ${client.config.ownerName} | Made with ❤️ by Zap` })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};

function formatUptime(uptime) {
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
}