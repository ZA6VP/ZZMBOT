const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    aliases: ['latency', 'p'],
    description: 'Check bot latency and status',
    async execute(message, args) {
        const { client } = message;
        const sent = await message.reply('🏓 Pinging...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);

        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setColor('#00ff00')
            .addFields(
                { name: '🤖 Bot Latency', value: `${latency}ms`, inline: true },
                { name: '🌐 API Latency', value: `${apiLatency}ms`, inline: true },
                { name: '😊 My Mood', value: client.botState.currentMood, inline: true },
                { name: '⏰ Uptime', value: formatUptime(client.uptime), inline: true },
                { name: '💬 Messages Processed', value: client.botState.stats.messagesProcessed.toString(), inline: true },
                { name: '🎮 Commands Executed', value: client.botState.stats.commandsExecuted.toString(), inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();

        await sent.edit({ content: null, embeds: [embed] });
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