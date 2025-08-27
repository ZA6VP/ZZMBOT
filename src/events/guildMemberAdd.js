const { createInfoEmbed } = require('../utils/embedBuilder');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            // Get bot client and config
            const client = member.client;
            const config = client.config;

            // Check if welcome is enabled and channel is configured
            if (!config.welcome || !config.welcome.enabled || !config.welcome.channel) {
                return;
            }

            const welcomeChannel = member.guild.channels.cache.get(config.welcome.channel);
            
            if (welcomeChannel) {
                const embed = createInfoEmbed(`Welcome to ${member.guild.name}!`, 
                    `Hey ${member.user.username}, welcome to our awesome server!\n\n` +
                    `🎉 You are member #${member.guild.memberCount}\n` +
                    `📋 Make sure to read the rules\n` +
                    `💬 Feel free to introduce yourself\n` +
                    `🎮 Have fun and enjoy your stay!`
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setColor('#00ff00')
                .setTimestamp();
                
                // Add server icon if available
                if (member.guild.iconURL()) {
                    embed.setFooter({ 
                        text: member.guild.name, 
                        iconURL: member.guild.iconURL() 
                    });
                }
                
                try {
                    const welcomeMessage = await welcomeChannel.send({ 
                        content: `<@${member.user.id}>`,
                        embeds: [embed] 
                    });
                    
                    // Add waving hand reaction
                    await welcomeMessage.react('👋');
                } catch (error) {
                    console.error('Error sending welcome message:', error);
                }
            }
        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
        }
    },
};
