const { createInfoEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'help',
        description: 'Get help about commands',
        usage: '!help [command]',
        aliases: ['h', 'commands'],
        cooldown: 3
    },
    async execute(message, args) {
        try {
            const { commands } = message.client;
            const config = message.client.config;

            // If no command specified, show general help
            if (!args.length) {
                const categories = {
                    'Moderation': ['ban', 'unban', 'kick', 'timeout', 'mute', 'warn', 'infractions', 'purge'],
                    'Admin': ['lock', 'unlock', 'announce'],
                    'Giveaways': ['gstart', 'gend', 'greroll'],
                    'Leveling': ['xp', 'leaderboard', 'setlevelrole'],
                    'Utility': ['ping', 'userinfo', 'serverinfo', 'help', 'suggest'],
                    'Fun': ['meme', 'roll', 'cat', 'dog', 'trivia']
                };

                const embed = createInfoEmbed('📖 Help Menu', 
                    `Use \`${config.prefix}help <command>\` for detailed information about a specific command.\n\n` +
                    `**Available Categories:**`
                )
                .setFooter({ text: `Total Commands: ${commands.size}` });

                // Add each category as a field
                for (const [category, commandList] of Object.entries(categories)) {
                    const availableCommands = commandList.filter(cmd => commands.has(cmd));
                    if (availableCommands.length > 0) {
                        embed.addFields({
                            name: `${category} (${availableCommands.length})`,
                            value: availableCommands.map(cmd => `\`${cmd}\``).join(', '),
                            inline: false
                        });
                    }
                }

                return message.reply({ embeds: [embed] });
            }

            // Show help for specific command
            const commandName = args[0].toLowerCase();
            const command = commands.get(commandName) || commands.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(commandName));

            if (!command) {
                const embed = createErrorEmbed('Command Not Found', `No command found with the name \`${commandName}\`.`);
                return message.reply({ embeds: [embed] });
            }

            const commandData = command.data;
            
            const embed = createInfoEmbed(`Command: ${commandData.name}`, commandData.description)
                .addFields(
                    { name: 'Usage', value: `\`${commandData.usage}\``, inline: false },
                    { name: 'Cooldown', value: `${commandData.cooldown || 3} seconds`, inline: true }
                );

            if (commandData.aliases && commandData.aliases.length > 0) {
                embed.addFields({ name: 'Aliases', value: commandData.aliases.map(alias => `\`${alias}\``).join(', '), inline: true });
            }

            // Add permission requirements if it's a moderation command
            const moderationCommands = ['ban', 'unban', 'kick', 'timeout', 'mute', 'warn', 'infractions', 'purge'];
            const adminCommands = ['lock', 'unlock', 'announce', 'setlevelrole'];
            
            if (moderationCommands.includes(commandData.name)) {
                embed.addFields({ name: 'Required Permissions', value: 'Varies by command (Ban Members, Kick Members, Manage Messages, etc.)', inline: false });
            } else if (adminCommands.includes(commandData.name)) {
                embed.addFields({ name: 'Required Permissions', value: 'Administrator', inline: false });
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in help command:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while fetching help information.');
            message.reply({ embeds: [embed] });
        }
    },
};
