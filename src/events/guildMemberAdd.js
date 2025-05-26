const { createInfoEmbed } = require('../utils/embedBuilder');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        // Welcome message for PDW Studios
        const welcomeChannelId = '1374540407073144986';
        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
        
        if (welcomeChannel) {
            const embed = createInfoEmbed('Welcome to PDW Studios', 
                'We hope you have a great time here!'
            )
            .setImage('https://cdn.discordapp.com/attachments/1373503079734837299/1375251357862461582/IMG_2600.gif?ex=6834f6a2&is=6833a522&hm=a08bc5ebe95256b8a4b05b759183738624145db3ed995bcf5ad2bf49465b3997&')
            .setColor('#00ff00');
            
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
    },
};
