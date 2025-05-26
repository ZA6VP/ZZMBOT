const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true,
        index: true
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
giveawaySchema.index({ endTime: 1, active: 1 });

module.exports = mongoose.model('Giveaway', giveawaySchema);
