const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ ${client.user.tag} is online!`);
        
        // Set bot activity
        client.user.setPresence({
            activities: [{ 
                name: `${client.config.prefix}help | ${client.guilds.cache.size} servers`,
                type: ActivityType.Watching 
            }],
            status: 'online'
        });
        
        // Update presence every 10 minutes
        setInterval(() => {
            const memberCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            client.user.setPresence({
                activities: [{ 
                    name: `${client.config.prefix}help | ${memberCount.toLocaleString()} users`,
                    type: ActivityType.Watching 
                }],
                status: 'online'
            });
        }, 600000);
    }
};