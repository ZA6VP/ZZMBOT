const moment = require('moment-timezone');

class EmotionManager {
    constructor(personality) {
        this.personality = personality;
        this.currentMood = personality.currentMood || 'happy';
        this.moodHistory = [];
        this.emotionalTriggers = {
            positive: ['good', 'great', 'awesome', 'amazing', 'love', 'happy', 'excited', 'fun'],
            negative: ['bad', 'terrible', 'awful', 'hate', 'angry', 'sad', 'disappointed', 'frustrated'],
            neutral: ['okay', 'fine', 'alright', 'whatever', 'meh']
        };
        this.moodIntensity = 0.5; // 0-1 scale
        this.lastMoodChange = Date.now();
    }

    updateMood(client) {
        const now = Date.now();
        const timeSinceLastChange = now - this.lastMoodChange;
        
        // Mood naturally drifts towards neutral over time
        if (timeSinceLastChange > 1800000) { // 30 minutes
            this.driftTowardsNeutral();
        }

        // Update client's bot state
        if (client && client.botState) {
            client.botState.currentMood = this.currentMood;
        }

        return this.currentMood;
    }

    driftTowardsNeutral() {
        const moods = this.personality.moods;
        const neutralMoods = ['happy', 'focused', 'playful'];
        
        if (!neutralMoods.includes(this.currentMood)) {
            this.currentMood = neutralMoods[Math.floor(Math.random() * neutralMoods.length)];
            this.lastMoodChange = Date.now();
        }
    }

    reactToMessage(message, client) {
        const content = message.content.toLowerCase();
        let moodChange = 0;

        // Check for emotional triggers
        for (const trigger of this.emotionalTriggers.positive) {
            if (content.includes(trigger)) {
                moodChange += 0.1;
            }
        }

        for (const trigger of this.emotionalTriggers.negative) {
            if (content.includes(trigger)) {
                moodChange -= 0.1;
            }
        }

        // Check for specific triggers
        if (content.includes('zolory') || content.includes('@')) {
            moodChange += 0.05; // Slight positive when mentioned
        }

        if (content.includes('zap') || content.includes('1219957467690172517')) {
            moodChange += 0.2; // Big positive for owner
        }

        // Check for rude behavior
        if (this.isRudeMessage(content)) {
            moodChange -= 0.3;
        }

        // Apply mood change
        this.applyMoodChange(moodChange);

        return this.getMoodResponse();
    }

    isRudeMessage(content) {
        const rudeWords = ['fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'cunt'];
        const rudePatterns = [
            /you\s+suck/i,
            /you're\s+stupid/i,
            /you're\s+dumb/i,
            /kill\s+yourself/i,
            /fuck\s+off/i
        ];

        // Check for rude words
        for (const word of rudeWords) {
            if (content.includes(word)) {
                return true;
            }
        }

        // Check for rude patterns
        for (const pattern of rudePatterns) {
            if (pattern.test(content)) {
                return true;
            }
        }

        return false;
    }

    applyMoodChange(change) {
        this.moodIntensity = Math.max(0, Math.min(1, this.moodIntensity + change));
        
        if (this.moodIntensity > 0.7) {
            this.currentMood = this.getPositiveMood();
        } else if (this.moodIntensity < 0.3) {
            this.currentMood = this.getNegativeMood();
        } else {
            this.currentMood = this.getNeutralMood();
        }

        this.lastMoodChange = Date.now();
        this.moodHistory.push({
            mood: this.currentMood,
            intensity: this.moodIntensity,
            timestamp: Date.now()
        });

        // Keep only last 100 mood entries
        if (this.moodHistory.length > 100) {
            this.moodHistory = this.moodHistory.slice(-100);
        }
    }

    getPositiveMood() {
        const positiveMoods = ['happy', 'excited', 'playful'];
        return positiveMoods[Math.floor(Math.random() * positiveMoods.length)];
    }

    getNegativeMood() {
        const negativeMoods = ['sad', 'angry', 'frustrated'];
        return negativeMoods[Math.floor(Math.random() * negativeMoods.length)];
    }

    getNeutralMood() {
        const neutralMoods = ['focused', 'serious', 'calm'];
        return neutralMoods[Math.floor(Math.random() * neutralMoods.length)];
    }

    getMoodResponse() {
        const responses = {
            happy: [
                "😊 Yo, I'm feeling pretty good rn!",
                "🔥 Aight bet, I'm vibing today!",
                "💯 Feeling blessed and grateful fr fr"
            ],
            excited: [
                "🚀 LET'S GOOO! I'm hyped rn!",
                "🔥 Yo this energy is crazy!",
                "💪 Feeling unstoppable today!"
            ],
            playful: [
                "😏 Hehe, I'm in a playful mood rn",
                "🎮 Who tryna play some games?",
                "😄 Feeling silly today ngl"
            ],
            sad: [
                "😔 Not feeling the best rn...",
                "💔 My heart's a little heavy today",
                "😢 Could use some good vibes"
            ],
            angry: [
                "😤 Yo, I'm heated rn",
                "💢 Not the time to test me",
                "😡 I'm not playing today"
            ],
            focused: [
                "🎯 I'm locked in rn",
                "🧠 Brain's working overtime",
                "💭 Deep in thought mode"
            ],
            serious: [
                "😐 I'm serious rn",
                "🤔 Thinking about some stuff",
                "😶 Not really in a joking mood"
            ],
            calm: [
                "😌 Chilling, feeling peaceful",
                "🌊 Just vibing, staying calm",
                "🧘‍♂️ In my zen mode rn"
            ]
        };

        const moodResponses = responses[this.currentMood] || responses.happy;
        return moodResponses[Math.floor(Math.random() * moodResponses.length)];
    }

    getEmotionalResponse(message, isRude = false) {
        if (isRude) {
            const rudeResponses = [
                "Yo, I don't play that disrespectful shit. Keep it respectful or keep it moving.",
                "Aight bet, you wanna be rude? I can match that energy real quick.",
                "Nah fam, I don't tolerate that kind of talk. Show some respect.",
                "Yo, I'm trying to be nice here but you're testing my patience.",
                "Listen, I'm all for banter but that's just being a dick. Chill out."
            ];
            return rudeResponses[Math.floor(Math.random() * rudeResponses.length)];
        }

        return this.getMoodResponse();
    }

    getCurrentMood() {
        return {
            mood: this.currentMood,
            intensity: this.moodIntensity,
            lastChange: this.lastMoodChange
        };
    }

    setMood(mood) {
        if (this.personality.moods.includes(mood)) {
            this.currentMood = mood;
            this.lastMoodChange = Date.now();
            return true;
        }
        return false;
    }
}

module.exports = { EmotionManager };