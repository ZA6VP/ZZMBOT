const { PermissionFlagsBits } = require('discord.js');
const { Giveaway } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'gend',
    aliases: ['giveawayend', 'gstop'],
    description: 'End a running giveaway early',
    usage: '!gend <messageID>',
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
                embeds: [embedBuilder.error('Invalid Usage', 'Please provide the message ID of the giveaway to end.')] 
            });
        }
        
        const messageId = args[0];
        
        try {
            // Find giveaway in database
            const giveaway = await Giveaway.findOne({ messageId, guildId: message.guild.id });
            
            if (!giveaway) {
                return message.reply({ 
                    embeds: [embedBuilder.error('Not Found', 'No giveaway found with that message ID.')] 
                });
            }
            
            if (giveaway.ended) {
                return message.reply({ 
                    embeds: [embedBuilder.error('Already Ended', 'This giveaway has already ended.')] 
                });
            }
            
            // Get the giveaway message
            const channel = message.guild.channels.cache.get(giveaway.channelId);
            if (!channel) {
                return message.reply({ 
                    embeds: [embedBuilder.error('Channel Not Found', 'The giveaway channel no longer exists.')] 
                });
            }
            
            const giveawayMessage = await channel.messages.fetch(messageId).catch(() => null);
            if (!giveawayMessage) {
                return message.reply({ 
                    embeds: [embedBuilder.error('Message Not Found', 'The giveaway message no longer exists.')] 
                });
            }
            
            // Get participants from reactions
            const reaction = giveawayMessage.reactions.cache.get(client.config.giveaway.reactionEmoji || '🎉');
            if (!reaction) {
                return message.reply({ 
                    embeds: [embedBuilder.error('No Reactions', 'No reactions found on the giveaway message.')] 
                });
            }
            
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
            
            // Update giveaway in database
            giveaway.ended = true;
            giveaway.participants = participants;
            giveaway.winnerIds = winners;
            giveaway.endTime = new Date(); // Update end time to now
            await giveaway.save();
            
            // Update the embed
            const hostedBy = await client.users.fetch(giveaway.hostedBy).catch(() => ({ tag: 'Unknown' }));
            const updatedEmbed = embedBuilder.giveaway(
                giveaway.prize,
                hostedBy.tag,
                giveaway.winners,
                giveaway.endTime,
                true,
                winners
            );
            
            await giveawayMessage.edit({ embeds: [updatedEmbed] });
            
            // Announce winners
            if (winners.length > 0) {
                const winnerMentions = winners.map(w => `<@${w}>`).join(', ');
                await channel.send(`🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
            } else {
                await channel.send('😢 No valid participants for this giveaway.');
            }
            
            // Confirm to the user
            message.reply({ 
                embeds: [embedBuilder.success('Giveaway Ended', `Successfully ended the giveaway for **${giveaway.prize}**.`)] 
            });
            
        } catch (error) {
            console.error('End giveaway error:', error);
            message.reply({ embeds: [embedBuilder.error('Failed', 'An error occurred while ending the giveaway.')] });
        }
    }
};