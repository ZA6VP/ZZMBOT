const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    guildId: {
        type: String,
        required: true
    },
    xp: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 0
    },
    lastXPGain: {
        type: Date,
        default: Date.now
    },
    totalMessages: {
        type: Number,
        default: 0
    },
    isMuted: {
        type: Boolean,
        default: false
    },
    muteExpires: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient queries
userSchema.index({ userId: 1, guildId: 1 });
userSchema.index({ guildId: 1, xp: -1 });

module.exports = mongoose.model('User', userSchema);
