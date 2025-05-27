const mongoose = require('mongoose');
const User = require('../models/User');
const { isDbConnected } = require('./database');

// In-memory storage for when database is unavailable
const memoryStorage = new Map();

function getMemoryKey(userId, guildId) {
    return `${userId}-${guildId}`;
}

async function addXP(userId, guildId, amount) {
    try {
        // Check if database is connected
        if (!isDbConnected()) {
            console.log('Database not connected, using memory storage for XP');
            return addXPToMemory(userId, guildId, amount);
        }

        let user = await User.findOne({ userId, guildId }).timeout(3000);

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
        console.error('Error adding XP to database, falling back to memory:', error);
        return addXPToMemory(userId, guildId, amount);
    }
}

function addXPToMemory(userId, guildId, amount) {
    const key = getMemoryKey(userId, guildId);
    let userData = memoryStorage.get(key) || {
        userId,
        guildId,
        xp: 0,
        level: 0,
        totalMessages: 0,
        lastXPGain: new Date()
    };

    userData.xp += amount;
    userData.totalMessages += 1;
    userData.lastXPGain = new Date();

    const newLevel = calculateLevelFromXP(userData.xp);
    const leveledUp = newLevel > userData.level;
    userData.level = Math.min(newLevel, 100000);

    memoryStorage.set(key, userData);

    return { user: userData, leveledUp, newLevel };
}

async function getUser(userId, guildId) {
    try {
        // Check if database is connected
        if (!isDbConnected()) {
            console.log('Database not connected, checking memory storage');
            const key = getMemoryKey(userId, guildId);
            return memoryStorage.get(key) || {
                userId,
                guildId,
                xp: 0,
                level: 0,
                totalMessages: 0,
                lastXPGain: new Date()
            };
        }

        let user = await User.findOne({ userId, guildId }).timeout(3000);

        if (!user) {
            user = new User({ userId, guildId, xp: 0, level: 0, totalMessages: 0, lastXPGain: new Date() });
            await user.save();
        }

        return user;
    } catch (error) {
        console.error('Error getting user from database, checking memory:', error);
        const key = getMemoryKey(userId, guildId);
        return memoryStorage.get(key) || {
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
        // Check if database is connected
        if (!isDbConnected()) {
            console.log('Database not connected, using memory storage for leaderboard');
            const memoryUsers = [];
            for (const [key, userData] of memoryStorage.entries()) {
                if (userData.guildId === guildId) {
                    memoryUsers.push(userData);
                }
            }
            return memoryUsers.sort((a, b) => b.xp - a.xp).slice(0, limit);
        }

        return await User.find({ guildId })
            .sort({ xp: -1 })
            .limit(limit)
            .timeout(3000);
    } catch (error) {
        console.error('Error getting leaderboard from database, using memory:', error);
        const memoryUsers = [];
        for (const [key, userData] of memoryStorage.entries()) {
            if (userData.guildId === guildId) {
                memoryUsers.push(userData);
            }
        }
        return memoryUsers.sort((a, b) => b.xp - a.xp).slice(0, limit);
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