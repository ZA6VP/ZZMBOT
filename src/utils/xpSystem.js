const User = require('../models/User');

async function addXP(userId, guildId, amount) {
    try {
        // Check if mongoose is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('Database not connected, skipping XP gain');
            return null;
        }

        let user = await User.findOne({ userId, guildId }).timeout(5000);
        
        if (!user) {
            user = new User({ userId, guildId, xp: amount, level: 0, totalMessages: 1, lastXPGain: new Date() });
        } else {
            user.xp += amount;
            user.totalMessages += 1;
            user.lastXPGain = new Date();
        }
        
        // Calculate new level with exponential scaling
        const newLevel = calculateLevelFromXP(user.xp);
        const leveledUp = newLevel > user.level;
        user.level = Math.min(newLevel, 100000); // Cap at level 100,000
        
        await user.save();
        
        return { user, leveledUp, newLevel };
    } catch (error) {
        console.error('Error adding XP:', error);
        return null;
    }
}

async function getUser(userId, guildId) {
    try {
        // Check if mongoose is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('Database not connected, returning default user data');
            return {
                userId,
                guildId,
                xp: 0,
                level: 0,
                totalMessages: 0,
                lastXPGain: new Date()
            };
        }

        let user = await User.findOne({ userId, guildId }).timeout(5000);
        
        if (!user) {
            user = new User({ userId, guildId, xp: 0, level: 0, totalMessages: 0, lastXPGain: new Date() });
            await user.save();
        }
        
        return user;
    } catch (error) {
        console.error('Error getting user:', error);
        return {
            userId,
            guildId,
            xp: 0,
            level: 0,
            totalMessages: 0,
            lastXPGain: new Date()
        };
    }
}

async function getLeaderboard(guildId, limit = 10) {
    try {
        // Check if mongoose is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('Database not connected, returning empty leaderboard');
            return [];
        }

        return await User.find({ guildId })
            .sort({ xp: -1 })
            .limit(limit)
            .timeout(5000);
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }
}

function getXPForLevel(level) {
    if (level <= 0) return 0;
    // Exponential formula: XP = 100 * (1.1^level - 1) / 0.1
    return Math.floor(100 * (Math.pow(1.1, level) - 1) / 0.1);
}

function getLevelFromXP(xp) {
    if (xp <= 0) return 0;
    // Inverse of exponential formula: level = log(xp * 0.1 / 100 + 1) / log(1.1)
    const level = Math.floor(Math.log(xp * 0.1 / 100 + 1) / Math.log(1.1));
    return Math.min(level, 100000); // Cap at level 100,000
}

function calculateLevelFromXP(xp) {
    return getLevelFromXP(xp);
}

function getXPToNextLevel(currentXP, currentLevel) {
    if (currentLevel >= 100000) return 0; // Max level reached
    const nextLevelXP = getXPForLevel(currentLevel + 1);
    return nextLevelXP - currentXP;
}

module.exports = {
    addXP,
    getUser,
    getLeaderboard,
    getXPForLevel,
    getLevelFromXP,
    calculateLevelFromXP,
    getXPToNextLevel
};
