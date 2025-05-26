const { createWarningEmbed } = require('../utils/embedBuilder');

module.exports = {
    name: 'messageDelete',
    async execute(message) {
        // Ignore bot messages and messages without content
        if (!message.guild || message.author?.bot || !message.content) return;
        
        const config = message.client.config;
        const logChannel = message.guild.channels.cache.find(ch => ch.name === config.logChannel);
        
        if (logChannel && message.author) {
            const embed = createWarningEmbed('Message Deleted', 
                `A message by ${message.author.tag} was deleted in ${message.channel}`
            )
            .addFields(
                { name: 'Content', value: message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content, inline: false },
                { name: 'Channel', value: message.channel.toString(), inline: true },
                { name: 'Author', value: message.author.tag, inline: true }
            )
            .setFooter({ text: `Message ID: ${message.id}` });
            
            logChannel.send({ embeds: [embed] }).catch(console.error);
        }
    },
};
