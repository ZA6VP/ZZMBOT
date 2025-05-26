const { createInfoEmbed } = require('../utils/embedBuilder');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        // Leave message for PDW Studios
        const leaveChannelId = '1374540274726080613';
        const leaveChannel = member.guild.channels.cache.get(leaveChannelId);
        
        if (leaveChannel) {
            const embed = createInfoEmbed('Has Left PDW Studios', 
                'We hope you come back soon'
            )
            .setImage('https://cdn.discordapp.com/attachments/1373503079734837299/1375251357862461582/IMG_2600.gif?ex=6834f6a2&is=6833a522&hm=a08bc5ebe95256b8a4b05b759183738624145db3ed995bcf5ad2bf49465b3997&')
            .setColor('#ff0000');
            
            try {
                const leaveMessage = await leaveChannel.send({ 
                    content: `**${member.user.username}**`,
                    embeds: [embed] 
                });
                
                // Add white P sign reaction
                await leaveMessage.react('🅿️');
            } catch (error) {
                console.error('Error sending leave message:', error);
            }
        }
    },
};