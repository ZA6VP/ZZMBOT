module.exports = {
    name: 'ping',
    description: 'Check the bot\'s latency',
    usage: '!ping',
    category: 'utility',
    cooldown: 3,
    
    async execute(message, args, client) {
        const sent = await message.reply('🏓 Pinging...');
        
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        
        const pingEmbed = {
            color: apiLatency < 100 ? 0x00ff00 : apiLatency < 200 ? 0xffff00 : 0xff0000,
            title: '🏓 Pong!',
            fields: [
                { name: '📨 Message Latency', value: `${latency}ms`, inline: true },
                { name: '💓 API Latency', value: `${apiLatency}ms`, inline: true }
            ],
            timestamp: new Date(),
            footer: { text: 'Response time may vary based on server location' }
        };
        
        sent.edit({ content: null, embeds: [pingEmbed] });
    }
};