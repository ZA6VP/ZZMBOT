module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        
        // Set bot status
        client.user.setPresence({
            activities: [{ name: `${client.config.prefix}help | Serving ${client.guilds.cache.size} servers`, type: 3 }],
            status: 'online',
        });
        
        console.log(`Bot is ready and serving ${client.guilds.cache.size} servers`);
    },
};
