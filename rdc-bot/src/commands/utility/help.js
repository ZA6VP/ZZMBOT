const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['commands', 'h'],
    description: 'Get help with bot commands',
    usage: '!help [command]',
    category: 'utility',
    
    async execute(message, args, client) {
        const prefix = client.config.prefix;
        
        if (args[0]) {
            // Get specific command help
            const commandName = args[0].toLowerCase();
            const command = client.commands.get(commandName) || 
                          client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            
            if (!command) {
                return message.reply(`❌ Command \`${commandName}\` not found.`);
            }
            
            const commandEmbed = {
                color: 0x0099ff,
                title: `📖 Command: ${command.name}`,
                fields: [
                    { name: 'Description', value: command.description || 'No description available.', inline: false },
                    { name: 'Usage', value: `\`${command.usage || `${prefix}${command.name}`}\``, inline: false },
                    { name: 'Category', value: command.category || 'General', inline: true },
                    { name: 'Cooldown', value: `${command.cooldown || 3} seconds`, inline: true }
                ],
                timestamp: new Date()
            };
            
            if (command.aliases && command.aliases.length > 0) {
                commandEmbed.fields.push({
                    name: 'Aliases',
                    value: command.aliases.map(a => `\`${a}\``).join(', '),
                    inline: false
                });
            }
            
            if (command.userPermissions && command.userPermissions.length > 0) {
                commandEmbed.fields.push({
                    name: 'Required Permissions',
                    value: command.userPermissions.join(', '),
                    inline: false
                });
            }
            
            return message.reply({ embeds: [commandEmbed] });
        }
        
        // Get all commands grouped by category
        const categories = {};
        
        client.commands.forEach(command => {
            // Skip owner-only commands unless user is owner
            if (command.ownerOnly && !client.config.ownerIds.includes(message.author.id)) return;
            
            const category = command.category || 'Other';
            if (!categories[category]) categories[category] = [];
            categories[category].push(command.name);
        });
        
        // Create help embed
        const helpEmbed = {
            color: 0x0099ff,
            title: '📚 RDC Bot Commands',
            description: `Use \`${prefix}help [command]\` for detailed information about a specific command.`,
            fields: [],
            timestamp: new Date(),
            footer: { text: `Requested by ${message.author.tag} • Prefix: ${prefix}` }
        };
        
        // Add category fields
        const categoryEmojis = {
            'moderation': '🔨',
            'giveaways': '🎉',
            'leveling': '📊',
            'utility': '🔧',
            'fun': '🎮',
            'admin': '⚙️'
        };
        
        for (const [category, commands] of Object.entries(categories)) {
            const emoji = categoryEmojis[category.toLowerCase()] || '📁';
            helpEmbed.fields.push({
                name: `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                value: commands.map(cmd => `\`${cmd}\``).join(', '),
                inline: false
            });
        }
        
        // Add additional info
        helpEmbed.fields.push({
            name: '🔗 Links',
            value: '[Invite Bot](https://discord.com) • [Support Server](https://discord.com) • [GitHub](https://github.com)',
            inline: false
        });
        
        message.reply({ embeds: [helpEmbed] });
    }
};