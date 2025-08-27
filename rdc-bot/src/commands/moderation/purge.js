const { PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'purge',
    aliases: ['clear', 'prune'],
    description: 'Delete multiple messages at once',
    usage: '!purge <number>',
    category: 'moderation',
    userPermissions: ['ManageMessages'],
    botPermissions: ['ManageMessages', 'ReadMessageHistory'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need the Manage Messages permission to use this command.')] });
        }
        
        // Delete the command message
        await message.delete().catch(() => {});
        
        // Parse amount
        const amount = parseInt(args[0]);
        
        if (!amount || amount < 1 || amount > 100) {
            const errorMsg = await message.channel.send({ 
                embeds: [embedBuilder.error('Invalid Amount', 'Please provide a number between 1 and 100.')] 
            });
            setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
            return;
        }
        
        try {
            // Fetch and bulk delete messages
            const messages = await message.channel.messages.fetch({ limit: amount });
            const deletable = messages.filter(msg => {
                const age = Date.now() - msg.createdTimestamp;
                return age < 1209600000; // 14 days in milliseconds
            });
            
            if (deletable.size === 0) {
                const errorMsg = await message.channel.send({ 
                    embeds: [embedBuilder.error('Cannot Purge', 'No messages found that can be deleted (messages must be less than 14 days old).')] 
                });
                setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
                return;
            }
            
            const deleted = await message.channel.bulkDelete(deletable, true);
            
            // Send confirmation message
            const confirmEmbed = embedBuilder.success(
                'Messages Purged',
                `Successfully deleted **${deleted.size}** messages.`
            );
            
            const confirmMsg = await message.channel.send({ embeds: [confirmEmbed] });
            setTimeout(() => confirmMsg.delete().catch(() => {}), 5000);
            
            // Log to mod channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
            if (logChannel) {
                const logEmbed = {
                    color: 0xff9900,
                    title: '🧹 Messages Purged',
                    fields: [
                        { name: 'Channel', value: `${message.channel} (${message.channel.name})`, inline: true },
                        { name: 'Moderator', value: `${message.author.tag}`, inline: true },
                        { name: 'Messages Deleted', value: deleted.size.toString(), inline: true }
                    ],
                    timestamp: new Date()
                };
                logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Purge error:', error);
            const errorMsg = await message.channel.send({ 
                embeds: [embedBuilder.error('Purge Failed', 'An error occurred while trying to purge messages.')] 
            });
            setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
        }
    }
};