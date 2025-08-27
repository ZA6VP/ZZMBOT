const { InteractionType } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.type === InteractionType.ApplicationCommand) {
            const command = client.slashCommands.get(interaction.commandName);
            
            if (!command) {
                return interaction.reply({ 
                    content: 'This command is not available.', 
                    ephemeral: true 
                });
            }
            
            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`Error executing slash command ${interaction.commandName}:`, error);
                
                const errorMessage = {
                    content: 'There was an error executing this command.',
                    ephemeral: true
                };
                
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
        
        // Handle button interactions (for nuke, giveaways, etc.)
        if (interaction.type === InteractionType.MessageComponent) {
            // These are handled by collectors in the respective commands
            return;
        }
    }
};