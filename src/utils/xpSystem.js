const User = require('../models/User');

async function addXP(userId, guildId, amount) {
    try {
        let user = await User.findOne({ userId, guildId });
        
        if (!user) {
            user = new User({ userId, guildId, xp: amount, level: 0 });
        } else {
            user.xp += amount;
        }
        
        user.totalMessages += 1;
        user.lastXPGain = new Date();
        
        // Calculate new level
        const newLevel = Math.floor(user.xp / 100);
        const leveledUp = newLevel > user.level;
        user.level = newLevel;
        
        await user.save();
        
        return { user, leveledUp, newLevel };
    } catch (error) {
        console.error('Error adding XP:', error);
        return null;
    }
}

async function getUser(userId, guildId) {
    try {
        let user = await User.findOne({ userId, guildId });
        
        if (!user) {
            user = new User({ userId, guildId });
            await user.save();
        }
        
        return user;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

async function getLeaderboard(guildId, limit = 10) {
    try {
        return await User.find({ guildId })
            .sort({ xp: -1 })
            .limit(limit);
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }
}

function getXPForLevel(level) {
    return level * 100;
}

function getLevelFromXP(xp) {
    return Math.floor(xp / 100);
}

module.exports = {
    addXP,
    getUser,
    getLeaderboard,
    getXPForLevel,
    getLevelFromXP
};
