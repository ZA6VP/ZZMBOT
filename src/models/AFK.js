
const mongoose = require('mongoose');

const afkSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        default: 'No reason provided'
    },
    afkSince: {
        type: Date,
        default: Date.now
    },
    mentions: [{
        userId: String,
        username: String,
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    originalNickname: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient queries
afkSchema.index({ userId: 1, guildId: 1 });

module.exports = mongoose.model('AFK', afkSchema);
