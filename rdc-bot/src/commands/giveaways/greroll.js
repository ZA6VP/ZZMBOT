const { PermissionFlagsBits } = require('discord.js');
const { Giveaway } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'greroll',
    aliases: ['giveawayreroll', 'reroll'],
    description: 'Pick new winners from an ended giveaway',
    usage: '!greroll <messageID> [winners]',
    category: 'giveaways',
    userPermissions: ['ManageGuild'],
    botPermissions: ['SendMessages', 'EmbedLinks'],
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
        
        if (!args[0]) {
            return message.reply({ 
                embeds: [embedBuilder.error('Invalid Usage', 'Please provide the message ID of the giveaway to reroll.')] 
            });
        }
        
        const messageId = args[0];
        const newWinnerCount = args[1] ? parseInt(args[1]) : null;
        
        if (newWinnerCount && (newWinnerCount < 1 || newWinnerCount > 20)) {
            return message.reply({ 
                embeds: [embedBuilder.error('Invalid Winners', 'Please provide a number of winners between 1 and 20.')] 
            });
        }
        
        try {
            // Find giveaway in database
            const giveaway = await Giveaway.findOne({ messageId, guildId: message.guild.id });
            
            if (!giveaway) {
                return message.reply({ 
                    embeds: [embedBuilder.error('Not Found', 'No giveaway found with that message ID.')] 
                });
            }
            
            if (!giveaway.ended) {
                return message.reply({ 
                    embeds: [embedBuilder.error('Not Ended', 'This giveaway has not ended yet. Use !gend to end it first.')] 
                });
            }
            
            // Get the giveaway channel
            const channel = message.guild.channels.cache.get(giveaway.channelId);
            if (!channel) {
                return message.reply({ 
                    embeds: [embedBuilder.error('Channel Not Found', 'The giveaway channel no longer exists.')] 
                });
            }
            
            // Filter out previous winners from participants
            const previousWinners = giveaway.winnerIds || [];
            const availableParticipants = giveaway.participants.filter(p => !previousWinners.includes(p));
            
            if (availableParticipants.length === 0) {
                return message.reply({ 
                    embeds: [embedBuilder.error('No Participants', 'No more participants available for reroll.')] 
                });
            }
            
            // Determine number of new winners
            const winnersToSelect = newWinnerCount || Math.min(giveaway.winners, availableParticipants.length);
            
            // Select new winners
            const newWinners = [];
            const participantsCopy = [...availableParticipants];
            
            for (let i = 0; i < Math.min(winnersToSelect, participantsCopy.length); i++) {
                const randomIndex = Math.floor(Math.random() * participantsCopy.length);
                newWinners.push(participantsCopy[randomIndex]);
                participantsCopy.splice(randomIndex, 1);
            }
            
            // Announce new winners
            if (newWinners.length > 0) {
                const winnerMentions = newWinners.map(w => `<@${w}>`).join(', ');
                await channel.send(`🎉 **NEW WINNERS!** Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
                
                // Update winners in database (append to existing winners)
                giveaway.winnerIds = [...previousWinners, ...newWinners];
                await giveaway.save();
                
                message.reply({ 
                    embeds: [embedBuilder.success(
                        'Reroll Complete', 
                        `Successfully picked ${newWinners.length} new winner(s) for **${giveaway.prize}**.`
                    )] 
                });
            } else {
                message.reply({ 
                    embeds: [embedBuilder.error('No Winners', 'Could not select any new winners.')] 
                });
            }
            
        } catch (error) {
            console.error('Reroll giveaway error:', error);
            message.reply({ embeds: [embedBuilder.error('Failed', 'An error occurred while rerolling the giveaway.')] });
        }
    }
};