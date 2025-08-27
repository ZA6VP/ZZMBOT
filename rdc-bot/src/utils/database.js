const mongoose = require('mongoose');

// User Schema (for XP and leveling)
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    username: String,
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    warnings: [{
        reason: String,
        moderator: String,
        timestamp: { type: Date, default: Date.now }
    }],
    infractions: [{
        type: { type: String, enum: ['warn', 'mute', 'kick', 'ban', 'timeout'] },
        reason: String,
        moderator: String,
        duration: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

// Giveaway Schema
const giveawaySchema = new mongoose.Schema({
    messageId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    prize: { type: String, required: true },
    winners: { type: Number, default: 1 },
    endTime: { type: Date, required: true },
    ended: { type: Boolean, default: false },
    hostedBy: String,
    participants: [String],
    winnerIds: [String]
}, { timestamps: true });

// Guild Settings Schema
const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    prefix: String,
    logChannel: String,
    welcomeChannel: String,
    welcomeMessage: String,
    suggestionsChannel: String,
    mutedRole: String,
    automodEnabled: { type: Boolean, default: true },
    badWords: [String],
    levelRoles: { type: Map, of: String }
}, { timestamps: true });

// Temporary Data Schema (for timeouts, mutes, etc.)
const tempDataSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    type: { type: String, enum: ['mute', 'timeout'], required: true },
    endTime: { type: Date, required: true },
    reason: String,
    roleIds: [String] // For storing removed roles during mute
});

tempDataSchema.index({ endTime: 1 });

// Export models
module.exports = {
    User: mongoose.model('User', userSchema),
    Giveaway: mongoose.model('Giveaway', giveawaySchema),
    Guild: mongoose.model('Guild', guildSchema),
    TempData: mongoose.model('TempData', tempDataSchema)
};