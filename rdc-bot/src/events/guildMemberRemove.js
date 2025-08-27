const { Guild } = require('../utils/database');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        try {
            // Get guild settings
            const guildData = await Guild.findOne({ guildId: member.guild.id });
            
            // Log to mod channel
            const logChannel = member.guild.channels.cache.find(ch => 
                ch.name === client.config.logChannel || ch.id === guildData?.logChannel
            );
            
            if (logChannel) {
                // Calculate time in server
                const joinedTimestamp = member.joinedTimestamp || Date.now();
                const timeInServer = Date.now() - joinedTimestamp;
                const daysInServer = Math.floor(timeInServer / (1000 * 60 * 60 * 24));
                
                const logEmbed = {
                    color: 0xff0000,
                    title: '📤 Member Left',
                    thumbnail: {
                        url: member.user.displayAvatarURL({ dynamic: true })
                    },
                    fields: [
                        { name: 'User', value: `${member.user.tag}`, inline: true },
                        { name: 'ID', value: member.id, inline: true },
                        { name: 'Time in Server', value: `${daysInServer} days`, inline: true }
                    ],
                    timestamp: new Date()
                };
                
                // Add roles they had
                const roles = member.roles.cache
                    .filter(role => role.id !== member.guild.id)
                    .map(role => role.name);
                    
                if (roles.length > 0) {
                    logEmbed.fields.push({
                        name: 'Roles',
                        value: roles.join(', ').substring(0, 1024),
                        inline: false
                    });
                }
                
                // Check recent bans to see if they were banned
                try {
                    const recentBan = await member.guild.bans.fetch(member.id).catch(() => null);
                    if (recentBan) {
                        logEmbed.title = '🔨 Member Banned';
                        logEmbed.fields.push({
                            name: 'Ban Reason',
                            value: recentBan.reason || 'No reason provided',
                            inline: false
                        });
                    }
                } catch (error) {
                    // Member wasn't banned, just left
                }
                
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }
            
        } catch (error) {
            console.error('guildMemberRemove error:', error);
        }
    }
};