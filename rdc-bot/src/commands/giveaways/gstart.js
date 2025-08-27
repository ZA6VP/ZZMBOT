const { PermissionFlagsBits } = require('discord.js');
const { Giveaway } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');
const ms = require('ms');

module.exports = {
    name: 'gstart',
    aliases: ['giveawaystart', 'gcreate'],
    description: 'Start a giveaway',
    usage: '!gstart <duration> <winners> <prize>',
    category: 'giveaways',
    userPermissions: ['ManageGuild'],
    botPermissions: ['SendMessages', 'EmbedLinks', 'AddReactions'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner or has giveaway manager role
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        const hasGiveawayRole = message.member.roles.cache.some(role => 
            client.config.giveaway.managerRoles.includes(role.name)
        );
        
        if (!hasOwnerBypass && !hasGiveawayRole && !message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply({ 
                embeds: [embedBuilder.error('Permission Denied', 'You need the Manage Server permission or a giveaway manager role to use this command.')] 
            });
        }
        
        if (args.length < 3) {
            return message.reply({ 
                embeds: [embedBuilder.error('Invalid Usage', 'Please use: !gstart <duration> <winners> <prize>\nExample: !gstart 1h 2 Discord Nitro')] 
            });
        }
        
        // Parse duration
        const duration = ms(args[0]);
        if (!duration || duration < 10000 || duration > 2592000000) { // 10 seconds to 30 days
            return message.reply({ 
                embeds: [embedBuilder.error('Invalid Duration', 'Please provide a valid duration between 10 seconds and 30 days.')] 
            });
        }
        
        // Parse winners
        const winners = parseInt(args[1]);
        if (!winners || winners < 1 || winners > 20) {
            return message.reply({ 
                embeds: [embedBuilder.error('Invalid Winners', 'Please provide a number of winners between 1 and 20.')] 
            });
        }
        
        // Parse prize
        const prize = args.slice(2).join(' ');
        if (!prize) {
            return message.reply({ 
                embeds: [embedBuilder.error('Invalid Prize', 'Please provide a prize description.')] 
            });
        }
        
        try {
            // Create giveaway embed
            const endTime = new Date(Date.now() + duration);
            const giveawayEmbed = embedBuilder.giveaway(prize, message.author.tag, winners, endTime, false);
            
            // Send giveaway message
            const giveawayMessage = await message.channel.send({ embeds: [giveawayEmbed] });
            
            // Add reaction
            await giveawayMessage.react(client.config.giveaway.reactionEmoji || '🎉');
            
            // Save to database
            await Giveaway.create({
                messageId: giveawayMessage.id,
                channelId: message.channel.id,
                guildId: message.guild.id,
                prize,
                winners,
                endTime,
                hostedBy: message.author.id,
                participants: []
            });
            
            // Delete command message
            await message.delete().catch(() => {});
            
            // Set timeout to end giveaway
            setTimeout(async () => {
                await endGiveaway(client, giveawayMessage.id);
            }, duration);
            
        } catch (error) {
            console.error('Giveaway start error:', error);
            message.reply({ embeds: [embedBuilder.error('Failed', 'An error occurred while starting the giveaway.')] });
        }
    }
};

// Helper function to end giveaway
async function endGiveaway(client, messageId) {
    try {
        const giveaway = await Giveaway.findOne({ messageId });
        if (!giveaway || giveaway.ended) return;
        
        const channel = client.channels.cache.get(giveaway.channelId);
        if (!channel) return;
        
        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) return;
        
        // Get participants from reactions
        const reaction = message.reactions.cache.get(client.config.giveaway.reactionEmoji || '🎉');
        if (!reaction) return;
        
        const users = await reaction.users.fetch();
        const participants = users.filter(u => !u.bot).map(u => u.id);
        
        // Select winners
        const winners = [];
        const availableParticipants = [...participants];
        
        for (let i = 0; i < Math.min(giveaway.winners, availableParticipants.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableParticipants.length);
            winners.push(availableParticipants[randomIndex]);
            availableParticipants.splice(randomIndex, 1);
        }
        
        // Update giveaway
        giveaway.ended = true;
        giveaway.participants = participants;
        giveaway.winnerIds = winners;
        await giveaway.save();
        
        // Update embed
        const hostedBy = await client.users.fetch(giveaway.hostedBy).catch(() => ({ tag: 'Unknown' }));
        const updatedEmbed = embedBuilder.giveaway(
            giveaway.prize,
            hostedBy.tag,
            giveaway.winners,
            giveaway.endTime,
            true,
            winners
        );
        
        await message.edit({ embeds: [updatedEmbed] });
        
        // Announce winners
        if (winners.length > 0) {
            const winnerMentions = winners.map(w => `<@${w}>`).join(', ');
            await channel.send(`🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
        } else {
            await channel.send('😢 No valid participants for this giveaway.');
        }
        
    } catch (error) {
        console.error('End giveaway error:', error);
    }
}