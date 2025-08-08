const fs = require('fs');
const path = require('path');

function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    
    // Check if commands directory exists
    if (!fs.existsSync(commandsPath)) {
        console.log('Commands directory not found, creating...');
        fs.mkdirSync(commandsPath, { recursive: true });
        return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('name' in command && 'execute' in command) {
            client.commands.set(command.name, command);
            
            // Add aliases if they exist
            if (command.aliases) {
                for (const alias of command.aliases) {
                    client.commands.set(alias, command);
                }
            }
            
            console.log(`✅ Loaded command: ${command.name}`);
        } else {
            console.log(`⚠️ [WARNING] The command at ${filePath} is missing a required "name" or "execute" property.`);
        }
    }
}

module.exports = { loadCommands };
