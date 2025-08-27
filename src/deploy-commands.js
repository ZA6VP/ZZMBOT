const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    // Friendly Raid slash command (works in DMs and Your Apps)
    new SlashCommandBuilder()
        .setName('friendlyraid')
        .setDescription('Start a friendly raid to boost server activity')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Custom message for the raid')
                .setRequired(false)),

    // Server Copy slash command (Your Apps only)
    new SlashCommandBuilder()
        .setName('copy')
        .setDescription('Copy server structure from another server')
        .addStringOption(option =>
            option.setName('server_id')
                .setDescription('ID of the server to copy from')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('include_roles')
                .setDescription('Copy roles from source server')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('include_channels')
                .setDescription('Copy channels from source server')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('include_emojis')
                .setDescription('Copy emojis from source server')
                .setRequired(false)),

    // Nuke slash command (Your Apps only)
    new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('⚠️ DANGER: Delete all server content except current channel'),

    // Ping command (works everywhere)
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency'),

    // User info command
    new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to get info about')
                .setRequired(false)),

    // Server info command
    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about the current server')
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // Register commands globally (works in DMs and Your Apps)
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID || 'YOUR_CLIENT_ID'),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();