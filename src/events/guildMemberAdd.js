const { createInfoEmbed } = require('../utils/embedBuilder');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const config = member.client.config;
        
        // Find the log channel
        const logChannel = member.guild.channels.cache.find(ch => ch.name === config.logChannel);
        
        if (logChannel) {
            const embed = createInfoEmbed('Member Joined', 
                `${member.user.tag} has joined the server.\nAccount created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'User ID', value: member.user.id, inline: true },
                { name: 'Member Count', value: member.guild.memberCount.toString(), inline: true }
            );
            
            logChannel.send({ embeds: [embed] }).catch(console.error);
        }
    },
};
