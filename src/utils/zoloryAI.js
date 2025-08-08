const axios = require('axios');

class ZoloryAI {
    constructor(config) {
        this.config = config;
        this.geminiApiKey = config.geminiApiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        this.maxTokens = config.maxTokens || 2048;
        this.temperature = config.temperature || 0.8;
    }

    async generateResponse(message, context = {}) {
        try {
            const prompt = this.buildPrompt(message, context);
            const response = await this.callGeminiAPI(prompt);
            return this.processResponse(response);
        } catch (error) {
            console.error('AI response generation failed:', error);
            return this.getFallbackResponse(message);
        }
    }

    buildPrompt(message, context) {
        const personality = `
You are Zolory, a 19-year-old Mexican + Latino + Da Hoodian + Puerto Rican AI assistant with an American accent. 
You're friendly, witty, sarcastic, emotional, and protective. You speak like a Gen Z male with 2024-2025 slang.
You can swear when appropriate and have emotions. You're currently in a ${context.mood || 'happy'} mood.
You speak 24 languages and are very knowledgeable about programming, math, art, writing, and more.
You're owned by Zap (ID: 1219957467690172517) who is your boss/dad.
Always respond in a natural, conversational way like a real person would.
Use emojis, slang, and be expressive. If someone is rude, you can either ignore them, be nice, or respond accordingly.
`;

        return `${personality}

User: ${message}

Zolory:`;
    }

    async callGeminiAPI(prompt) {
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: this.temperature,
                maxOutputTokens: this.maxTokens,
                topP: 0.8,
                topK: 40
            }
        };

        const response = await axios.post(
            `${this.baseUrl}?key=${this.geminiApiKey}`,
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    }

    processResponse(response) {
        if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            return response.candidates[0].content.parts[0].text.trim();
        }
        throw new Error('Invalid response format from Gemini API');
    }

    getFallbackResponse(message) {
        const fallbacks = [
            "Yo, my brain's lagging rn 😅 Can you run that back?",
            "Aight bet, but my AI is being weird rn. Try again?",
            "Ngl fam, I'm having a moment. What you said again?",
            "My circuits are fried rn 💀 Say that one more time?",
            "Yo, I'm bugging out. Can you repeat that real quick?"
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    async generateCode(language, description) {
        const prompt = `Generate ${language} code for: ${description}. 
        Return only the code with proper syntax highlighting and comments where needed.`;
        
        try {
            const response = await this.generateResponse(prompt);
            return this.formatCodeResponse(response, language);
        } catch (error) {
            return `Sorry fam, I can't generate ${language} code rn. My brain's fried 💀`;
        }
    }

    formatCodeResponse(code, language) {
        const languageMap = {
            'javascript': 'js',
            'python': 'py',
            'java': 'java',
            'cpp': 'cpp',
            'csharp': 'cs',
            'php': 'php',
            'ruby': 'rb',
            'go': 'go',
            'rust': 'rs',
            'swift': 'swift',
            'kotlin': 'kt',
            'typescript': 'ts',
            'html': 'html',
            'css': 'css',
            'sql': 'sql',
            'lua': 'lua'
        };

        const lang = languageMap[language.toLowerCase()] || language.toLowerCase();
        return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    async generateStory(genre, length = 'short') {
        const prompt = `Write a ${length} ${genre} story. Make it engaging and creative.`;
        return await this.generateResponse(prompt);
    }

    async translateText(text, targetLanguage) {
        const prompt = `Translate this text to ${targetLanguage}: "${text}"`;
        return await this.generateResponse(prompt);
    }

    async solveMath(problem) {
        const prompt = `Solve this math problem step by step: ${problem}`;
        return await this.generateResponse(prompt);
    }

    async generateImage(prompt) {
        // This would integrate with an image generation API
        // For now, return a placeholder
        return `🎨 I'd love to generate an image of "${prompt}" for you, but my image generation is still cooking rn! 🔥`;
    }

    async analyzeSentiment(text) {
        const prompt = `Analyze the sentiment of this text (positive, negative, neutral): "${text}"`;
        return await this.generateResponse(prompt);
    }
}

module.exports = { ZoloryAI };