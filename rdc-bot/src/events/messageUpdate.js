const { Guild } = require('../utils/database');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage, client) {
        // Ignore DMs, bot messages, and if content didn't change
        if (!newMessage.guild || newMessage.author?.bot || oldMessage.content === newMessage.content) return;
        
        try {
            // Get guild settings
            const guildData = await Guild.findOne({ guildId: newMessage.guild.id });
            
            // Find log channel
            const logChannel = newMessage.guild.channels.cache.find(ch => 
                ch.name === client.config.logChannel || ch.id === guildData?.logChannel
            );
            
            if (!logChannel || logChannel.id === newMessage.channel.id) return;
            
            // Create log embed
            const editEmbed = {
                color: 0xffff00,
                title: '✏️ Message Edited',
                fields: [
                    { 
                        name: 'Author', 
                        value: `${newMessage.author.tag} (${newMessage.author})`, 
                        inline: true 
                    },
                    { 
                        name: 'Channel', 
                        value: `${newMessage.channel} (${newMessage.channel.name})`, 
                        inline: true 
                    },
                    { 
                        name: 'Message Link', 
                        value: `[Jump to Message](${newMessage.url})`, 
                        inline: true 
                    }
                ],
                timestamp: new Date(),
                footer: { text: `Message ID: ${newMessage.id}` }
            };
            
            // Add old content
            if (oldMessage.content) {
                const oldContent = oldMessage.content.length > 1024 
                    ? oldMessage.content.substring(0, 1021) + '...' 
                    : oldMessage.content;
                    
                editEmbed.fields.push({
                    name: '📤 Old Content',
                    value: oldContent || 'No text content',
                    inline: false
                });
            }
            
            // Add new content
            if (newMessage.content) {
                const newContent = newMessage.content.length > 1024 
                    ? newMessage.content.substring(0, 1021) + '...' 
                    : newMessage.content;
                    
                editEmbed.fields.push({
                    name: '📥 New Content',
                    value: newContent || 'No text content',
                    inline: false
                });
            }
            
            // Check for bad words in edited message (auto-mod)
            const badWords = client.config.automod.badWords || [];
            const containsBadWord = badWords.some(word => 
                newMessage.content.toLowerCase().includes(word.toLowerCase())
            );
            
            if (containsBadWord && !newMessage.member.permissions.has('ManageMessages')) {
                await newMessage.delete().catch(() => {});
                editEmbed.fields.push({
                    name: '⚠️ Auto-Moderation',
                    value: 'Message deleted for containing inappropriate content',
                    inline: false
                });
            }
            
            logChannel.send({ embeds: [editEmbed] }).catch(console.error);
            
        } catch (error) {
            console.error('messageUpdate error:', error);
        }
    }
};