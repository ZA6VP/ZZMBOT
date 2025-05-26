const { createInfoEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'ping',
        description: 'Check the bot\'s latency',
        usage: '!ping',
        aliases: ['latency', 'pong'],
        cooldown: 3
    },
    async execute(message, args) {
        try {
            const sent = await message.reply('🏓 Pinging...');
            
            const messageLatency = sent.createdTimestamp - message.createdTimestamp;
            const apiLatency = Math.round(message.client.ws.ping);
            
            // Determine latency quality
            let latencyStatus = '';
            if (apiLatency < 100) {
                latencyStatus = '🟢 Excellent';
            } else if (apiLatency < 200) {
                latencyStatus = '🟡 Good';
            } else if (apiLatency < 500) {
                latencyStatus = '🟠 Poor';
            } else {
                latencyStatus = '🔴 Very Poor';
            }
            
            const embed = createInfoEmbed('🏓 Pong!', 
                `**Bot Latency:** ${messageLatency}ms\n**API Latency:** ${apiLatency}ms\n**Status:** ${latencyStatus}`
            );
            
            await sent.edit({ content: '', embeds: [embed] });
            
        } catch (error) {
            console.error('Error in ping command:', error);
            message.reply('An error occurred while checking latency.');
        }
    },
};
