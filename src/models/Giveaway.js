const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    channelId: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    hostId: {
        type: String,
        required: true
    },
    prize: {
        type: String,
        required: true
    },
    winners: {
        type: Number,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    participants: [{
        type: String
    }],
    winnersList: [{
        type: String
    }],
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
giveawaySchema.index({ messageId: 1 });
giveawaySchema.index({ endTime: 1, active: 1 });

module.exports = mongoose.model('Giveaway', giveawaySchema);
