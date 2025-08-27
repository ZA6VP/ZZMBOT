const { Guild } = require('../utils/database');

module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        // Ignore DMs and bot messages
        if (!message.guild || message.author?.bot) return;
        
        try {
            // Get guild settings
            const guildData = await Guild.findOne({ guildId: message.guild.id });
            
            // Find log channel
            const logChannel = message.guild.channels.cache.find(ch => 
                ch.name === client.config.logChannel || ch.id === guildData?.logChannel
            );
            
            if (!logChannel || logChannel.id === message.channel.id) return;
            
            // Create log embed
            const deleteEmbed = {
                color: 0xff9900,
                title: '🗑️ Message Deleted',
                fields: [
                    { 
                        name: 'Author', 
                        value: message.author ? `${message.author.tag} (${message.author})` : 'Unknown', 
                        inline: true 
                    },
                    { 
                        name: 'Channel', 
                        value: `${message.channel} (${message.channel.name})`, 
                        inline: true 
                    },
                    { 
                        name: 'Message ID', 
                        value: message.id, 
                        inline: true 
                    }
                ],
                timestamp: message.createdAt,
                footer: { text: 'Message sent at' }
            };
            
            // Add message content
            if (message.content) {
                const content = message.content.length > 1024 
                    ? message.content.substring(0, 1021) + '...' 
                    : message.content;
                    
                deleteEmbed.fields.push({
                    name: 'Content',
                    value: content || 'No text content',
                    inline: false
                });
            }
            
            // Add attachments info
            if (message.attachments.size > 0) {
                const attachments = message.attachments.map(att => 
                    `[${att.name}](${att.url})`
                ).join('\n');
                
                deleteEmbed.fields.push({
                    name: 'Attachments',
                    value: attachments.substring(0, 1024),
                    inline: false
                });
            }
            
            // Add embeds count
            if (message.embeds.length > 0) {
                deleteEmbed.fields.push({
                    name: 'Embeds',
                    value: `${message.embeds.length} embed(s)`,
                    inline: true
                });
            }
            
            // Try to get who deleted it from audit logs
            try {
                const auditLogs = await message.guild.fetchAuditLogs({
                    limit: 1,
                    type: 72 // MESSAGE_DELETE
                });
                
                const deleteLog = auditLogs.entries.first();
                if (deleteLog && 
                    deleteLog.target.id === message.author?.id && 
                    deleteLog.createdTimestamp > Date.now() - 5000) {
                    deleteEmbed.fields.push({
                        name: 'Deleted By',
                        value: `${deleteLog.executor.tag}`,
                        inline: true
                    });
                }
            } catch (error) {
                // Couldn't fetch audit logs
            }
            
            logChannel.send({ embeds: [deleteEmbed] }).catch(console.error);
            
        } catch (error) {
            console.error('messageDelete error:', error);
        }
    }
};