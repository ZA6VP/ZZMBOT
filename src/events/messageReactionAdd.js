const Giveaway = require('../models/Giveaway');

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        // Ignore bot reactions
        if (user.bot) return;
        
        // Check if this is a giveaway reaction
        try {
            const giveaway = await Giveaway.findOne({ 
                messageId: reaction.message.id, 
                active: true 
            });
            
            if (giveaway && reaction.emoji.name === '🎉') {
                // Add user to participants if not already added
                if (!giveaway.participants.includes(user.id)) {
                    giveaway.participants.push(user.id);
                    await giveaway.save();
                }
            }
        } catch (error) {
            console.error('Error handling giveaway reaction:', error);
        }
    },
};
