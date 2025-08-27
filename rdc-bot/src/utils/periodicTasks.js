const { TempData, Giveaway } = require('./database');
const embedBuilder = require('./embedBuilder');

module.exports = {
    startPeriodicTasks(client) {
        // Check for expired mutes every minute
        setInterval(async () => {
            try {
                const expiredMutes = await TempData.find({
                    type: 'mute',
                    endTime: { $lte: new Date() }
                });
                
                for (const mute of expiredMutes) {
                    const guild = client.guilds.cache.get(mute.guildId);
                    if (!guild) continue;
                    
                    const member = guild.members.cache.get(mute.userId);
                    if (!member) continue;
                    
                    const mutedRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
                    if (mutedRole && member.roles.cache.has(mutedRole.id)) {
                        await member.roles.remove(mutedRole, 'Mute duration expired');
                        
                        // Log unmute
                        const logChannel = guild.channels.cache.find(ch => ch.name === client.config.logChannel);
                        if (logChannel) {
                            const logEmbed = {
                                color: 0x00ff00,
                                title: '🔊 User Unmuted (Auto)',
                                fields: [
                                    { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                                    { name: 'Reason', value: 'Mute duration expired', inline: true }
                                ],
                                timestamp: new Date()
                            };
                            logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                        }
                    }
                    
                    // Remove from database
                    await TempData.deleteOne({ _id: mute._id });
                }
            } catch (error) {
                console.error('Auto-unmute error:', error);
            }
        }, 60000); // Every minute
        
        // Check for ended giveaways every 30 seconds
        setInterval(async () => {
            try {
                const endedGiveaways = await Giveaway.find({
                    ended: false,
                    endTime: { $lte: new Date() }
                });
                
                for (const giveaway of endedGiveaways) {
                    await endGiveaway(client, giveaway);
                }
            } catch (error) {
                console.error('Giveaway check error:', error);
            }
        }, 30000); // Every 30 seconds
    }
};

async function endGiveaway(client, giveaway) {
    try {
        const channel = client.channels.cache.get(giveaway.channelId);
        if (!channel) return;
        
        const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
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