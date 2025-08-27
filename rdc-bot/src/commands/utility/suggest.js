const { Guild } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'suggest',
    aliases: ['suggestion'],
    description: 'Submit a suggestion',
    usage: '!suggest <your suggestion>',
    category: 'utility',
    cooldown: 60, // 1 minute cooldown
    guildOnly: true,
    
    async execute(message, args, client) {
        if (!args[0]) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please provide a suggestion.')] });
        }
        
        const suggestion = args.join(' ');
        
        if (suggestion.length > 1000) {
            return message.reply({ embeds: [embedBuilder.error('Too Long', 'Suggestions must be under 1000 characters.')] });
        }
        
        try {
            // Get suggestions channel from database
            const guildData = await Guild.findOne({ guildId: message.guild.id });
            const channelId = guildData?.suggestionsChannel || null;
            
            // Try to find channel by name if not set in database
            let suggestionsChannel;
            if (channelId) {
                suggestionsChannel = message.guild.channels.cache.get(channelId);
            }
            
            if (!suggestionsChannel) {
                suggestionsChannel = message.guild.channels.cache.find(ch => 
                    ch.name === client.config.suggestionsChannel || ch.name === 'suggestions'
                );
            }
            
            if (!suggestionsChannel) {
                return message.reply({ 
                    embeds: [embedBuilder.error('No Channel', 'Suggestions channel not found. Please ask an admin to set one up.')] 
                });
            }
            
            // Create suggestion embed
            const suggestionEmbed = {
                color: 0x0099ff,
                author: {
                    name: `${message.author.tag}`,
                    icon_url: message.author.displayAvatarURL({ dynamic: true })
                },
                title: '💡 New Suggestion',
                description: suggestion,
                fields: [
                    { name: 'Status', value: '⏳ Pending Review', inline: true },
                    { name: 'Submitted', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                ],
                timestamp: new Date(),
                footer: { text: `User ID: ${message.author.id}` }
            };
            
            // Send suggestion
            const suggestionMessage = await suggestionsChannel.send({ embeds: [suggestionEmbed] });
            
            // Add voting reactions
            await suggestionMessage.react('✅');
            await suggestionMessage.react('❌');
            
            // Confirm to user
            const confirmEmbed = embedBuilder.success(
                'Suggestion Submitted',
                `Your suggestion has been sent to ${suggestionsChannel}!`
            );
            
            message.reply({ embeds: [confirmEmbed] });
            
            // Delete original message if bot has permissions
            if (message.deletable) {
                await message.delete().catch(() => {});
            }
            
        } catch (error) {
            console.error('Suggest error:', error);
            message.reply({ embeds: [embedBuilder.error('Failed', 'An error occurred while submitting your suggestion.')] });
        }
    }
};