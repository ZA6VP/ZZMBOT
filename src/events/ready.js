const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`🤖 ${client.config.botPersonality.name} is ready! Logged in as ${client.user.tag}`);
        
        // Set initial bot status
        const activity = `${client.config.botPersonality.name} | ${client.botState.currentMood}`;
        client.user.setActivity(activity, { type: ActivityType.Playing });
        
        console.log(`✅ ${client.config.botPersonality.name} is serving ${client.guilds.cache.size} servers`);
        console.log(`😊 Current mood: ${client.botState.currentMood}`);
        console.log(`🌍 Languages: ${client.config.botPersonality.languages.length}`);
        console.log(`👤 Owner: ${client.config.ownerName} (${client.config.ownerId})`);
    },
};
