const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'suggest',
        description: 'Submit a suggestion',
        usage: '!suggest <suggestion>',
        aliases: ['suggestion'],
        cooldown: 60
    },
    async execute(message, args) {
        try {
            // Check if suggestion was provided
            const suggestion = args.join(' ');
            if (!suggestion || suggestion.length < 10) {
                const embed = createErrorEmbed('Invalid Suggestion', 'Please provide a suggestion with at least 10 characters.\nUsage: `!suggest <your suggestion>`');
                return message.reply({ embeds: [embed] });
            }

            if (suggestion.length > 1000) {
                const embed = createErrorEmbed('Suggestion Too Long', 'Please keep your suggestion under 1000 characters.');
                return message.reply({ embeds: [embed] });
            }

            // Find suggestions channel
            const suggestChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.suggestChannel) ||
                                 message.guild.channels.cache.find(ch => ch.name === 'suggestions');

            if (!suggestChannel) {
                const embed = createErrorEmbed('No Suggestions Channel', 'No suggestions channel found. Please contact an administrator.');
                return message.reply({ embeds: [embed] });
            }

            // Create suggestion embed
            const suggestionEmbed = createInfoEmbed('💡 New Suggestion', suggestion)
                .setColor('#FFAA00')
                .setAuthor({ 
                    name: message.author.tag, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setFooter({ text: `User ID: ${message.author.id}` })
                .setTimestamp();

            // Send suggestion to suggestions channel
            const suggestionMessage = await suggestChannel.send({ embeds: [suggestionEmbed] });

            // Add reaction votes
            await suggestionMessage.react('👍');
            await suggestionMessage.react('👎');

            // Confirm to user
            const confirmEmbed = createSuccessEmbed('Suggestion Submitted', 
                `Your suggestion has been submitted to ${suggestChannel}!\n\n**Your suggestion:** ${suggestion.substring(0, 200)}${suggestion.length > 200 ? '...' : ''}`
            );
            
            await message.reply({ embeds: [confirmEmbed] });

            // Delete original message if not in suggestions channel
            if (message.channel.id !== suggestChannel.id) {
                setTimeout(() => {
                    message.delete().catch(console.error);
                }, 5000);
            }

        } catch (error) {
            console.error('Error in suggest command:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while submitting your suggestion.');
            message.reply({ embeds: [embed] });
        }
    },
};
