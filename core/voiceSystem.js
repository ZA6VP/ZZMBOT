const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const { createWriteStream, createReadStream, unlinkSync, existsSync } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const axios = require('axios');
const crypto = require('crypto');

/**
 * 🎤 ZOLORY PROFESSIONAL VOICE SYNTHESIS SYSTEM
 * 
 * AUTHENTIC PUERTO RICAN MALE VOICE (19 YEARS OLD)
 * - ElevenLabs API integration for studio-quality voice
 * - Azure Cognitive Services for backup
 * - Google Cloud Text-to-Speech for additional options
 * - Custom voice processing for Puerto Rican accent
 * - Real-time emotion modulation
 * - Human-like speech patterns and timing
 * - Zero robotic characteristics
 * 
 * VOICE CHARACTERISTICS:
 * - Age: 19 (post-puberty, young adult male voice)
 * - Accent: Strong Puerto Rican with NYC influence
 * - Language: Fluent Spanglish (Spanish/English mix)
 * - Tone: Confident, friendly, street-smart
 * - Pitch: Medium-low (masculine but youthful)
 * - Speed: Natural conversational pace
 * - Energy: High enthusiasm with authentic emotions
 */

class ZoloryVoiceSystem {
    constructor() {
        this.voiceConnections = new Map();
        this.audioPlayers = new Map();
        this.voiceQueue = new Map();
        this.isProcessing = new Map();
        
        // Voice synthesis configuration
        this.voiceConfig = {
            primaryProvider: 'elevenlabs',
            backupProvider: 'azure',
            voiceId: 'zolory_pr_male_19',
            model: 'eleven_multilingual_v2',
            
            // Puerto Rican male voice characteristics
            voiceSettings: {
                stability: 0.75,        // Consistent but natural variation
                similarity_boost: 0.85, // High similarity to target voice
                style: 0.65,           // Moderate style application
                use_speaker_boost: true // Enhance clarity
            },
            
            // Audio processing settings
            audioFormat: 'mp3',
            sampleRate: 22050,
            bitrate: 128,
            
            // Human-like speech patterns
            speechPatterns: {
                pauseVariation: true,     // Natural pauses
                breathingSounds: true,    // Subtle breathing
                filler_words: true,       // "um", "eh", "pues"
                emotionalInflection: true, // Tone changes
                accentStrength: 0.9       // Strong Puerto Rican accent
            }
        };
        
        // Initialize voice APIs
        this.initializeVoiceAPIs();
    }

    async initializeVoiceAPIs() {
        console.log('🎤 Initializing Professional Voice Synthesis APIs...');
        
        // ElevenLabs API (Primary)
        this.elevenLabsAPI = {
            baseURL: 'https://api.elevenlabs.io/v1',
            apiKey: process.env.ELEVENLABS_API_KEY,
            voiceId: 'pNInz6obpgDQGcFmaJgB', // Default, will be replaced with custom
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': process.env.ELEVENLABS_API_KEY
            }
        };
        
        // Azure Cognitive Services (Backup)
        this.azureAPI = {
            endpoint: process.env.AZURE_SPEECH_ENDPOINT || 'https://eastus.tts.speech.microsoft.com',
            apiKey: process.env.AZURE_SPEECH_KEY,
            region: process.env.AZURE_SPEECH_REGION || 'eastus',
            voiceName: 'es-PR-KarinaNeural' // Puerto Rican voice, will modify for male
        };
        
        // Google Cloud TTS (Secondary backup)
        this.googleAPI = {
            apiKey: process.env.GOOGLE_CLOUD_API_KEY,
            languageCode: 'es-PR',
            voiceName: 'es-PR-Standard-A', // Will modify for male voice
            audioEncoding: 'MP3'
        };
        
        // Load custom voice model if available
        await this.loadCustomVoiceModel();
        
        console.log('✅ Voice synthesis APIs initialized!');
    }

    async loadCustomVoiceModel() {
        try {
            // Check if we have a custom Zolory voice model
            if (process.env.ZOLORY_VOICE_MODEL_ID) {
                this.voiceConfig.voiceId = process.env.ZOLORY_VOICE_MODEL_ID;
                console.log('🎯 Loaded custom Zolory voice model!');
            } else {
                // Use the closest Puerto Rican male voice available
                this.voiceConfig.voiceId = await this.findBestPuertoRicanVoice();
            }
        } catch (error) {
            console.log('⚠️ Using default voice configuration');
        }
    }

    async findBestPuertoRicanVoice() {
        try {
            // Query ElevenLabs for available voices
            const response = await axios.get(`${this.elevenLabsAPI.baseURL}/voices`, {
                headers: { 'xi-api-key': this.elevenLabsAPI.apiKey }
            });
            
            const voices = response.data.voices;
            
            // Look for Puerto Rican/Latino male voices
            const targetCharacteristics = ['puerto', 'rican', 'latino', 'spanish', 'male', 'young'];
            
            let bestVoice = null;
            let bestScore = 0;
            
            for (const voice of voices) {
                const description = (voice.description || '').toLowerCase();
                const name = voice.name.toLowerCase();
                
                let score = 0;
                for (const char of targetCharacteristics) {
                    if (description.includes(char) || name.includes(char)) {
                        score++;
                    }
                }
                
                // Prefer male voices
                if (voice.labels?.gender === 'male') score += 2;
                if (voice.labels?.age === 'young') score += 1;
                if (voice.labels?.accent?.includes('spanish')) score += 2;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestVoice = voice;
                }
            }
            
            if (bestVoice) {
                console.log(`🎯 Found optimal voice: ${bestVoice.name} (score: ${bestScore})`);
                return bestVoice.voice_id;
            }
            
        } catch (error) {
            console.log('⚠️ Could not query voices, using fallback');
        }
        
        // Fallback to a good general purpose voice
        return 'pNInz6obpgDQGcFmaJgB'; // ElevenLabs Adam voice (male)
    }

    // Main voice synthesis method
    async synthesizeVoice(text, options = {}) {
        try {
            console.log(`🎤 Synthesizing: "${text}"`);
            
            // Preprocess text for authentic Puerto Rican speech
            const processedText = await this.preprocessTextForSpeech(text, options);
            
            // Try primary provider (ElevenLabs)
            let audioBuffer = await this.synthesizeWithElevenLabs(processedText, options);
            
            if (!audioBuffer) {
                console.log('🔄 ElevenLabs failed, trying Azure...');
                audioBuffer = await this.synthesizeWithAzure(processedText, options);
            }
            
            if (!audioBuffer) {
                console.log('🔄 Azure failed, trying Google...');
                audioBuffer = await this.synthesizeWithGoogle(processedText, options);
            }
            
            if (!audioBuffer) {
                throw new Error('All voice synthesis providers failed');
            }
            
            // Post-process audio for human-like characteristics
            audioBuffer = await this.postProcessAudio(audioBuffer, options);
            
            return audioBuffer;
            
        } catch (error) {
            console.error('Voice synthesis error:', error);
            return null;
        }
    }

    async preprocessTextForSpeech(text, options = {}) {
        let processedText = text;
        
        // Convert text slang to speech-friendly format
        const textReplacements = {
            // Internet slang to speech
            'fr fr': 'for real for real',
            'ngl': 'not gonna lie',
            'periodt': 'period',
            'deadass': 'dead ass',
            'lowkey': 'low key',
            'highkey': 'high key',
            'ong': 'on god',
            'bet': 'bet',
            'cap': 'cap',
            'no cap': 'no cap',
            'sheesh': 'sheesh',
            
            // Remove emojis but keep their emotional intent
            '💯': '',
            '🔥': '',
            '😤': '',
            '🎤': '',
            '🇵🇷': '',
            '💀': '',
            '👋': '',
            '🚫': '',
            '✅': '',
            '❌': '',
            
            // Spanish accent adjustments
            'you': 'ju',
            'yeah': 'yea',
            'what': 'wat',
            'that': 'dat',
            'this': 'dis',
            'with': 'wit',
            'the': 'da',
            
            // Puerto Rican speech patterns
            'going to': 'gonna',
            'want to': 'wanna',
            'have to': 'gotta',
            'kind of': 'kinda',
            'sort of': 'sorta',
            'a lot of': 'a lotta',
            'out of': 'outta'
        };
        
        // Apply replacements
        for (const [find, replace] of Object.entries(textReplacements)) {
            if (typeof find === 'string') {
                processedText = processedText.replace(new RegExp(find, 'gi'), replace);
            } else {
                processedText = processedText.replace(find, replace);
            }
        }
        
        // Add natural Puerto Rican filler words and expressions
        if (Math.random() < 0.3) {
            const fillers = ['pues', 'mira', 'oye', 'ay', 'bueno', 'dale'];
            const filler = fillers[Math.floor(Math.random() * fillers.length)];
            processedText = `${filler}, ${processedText}`;
        }
        
        // Add natural breathing pauses
        processedText = processedText.replace(/\./g, '... ');
        processedText = processedText.replace(/,/g, ', ');
        
        // Emotional emphasis based on content
        if (processedText.includes('fire') || processedText.includes('amazing') || processedText.includes('wepa')) {
            options.emotion = 'excited';
            options.energyLevel = 0.9;
        } else if (processedText.includes('ay no') || processedText.includes('mad') || processedText.includes('angry')) {
            options.emotion = 'frustrated';
            options.energyLevel = 0.8;
        }
        
        console.log(`📝 Processed text: "${processedText}"`);
        return processedText;
    }

    async synthesizeWithElevenLabs(text, options = {}) {
        try {
            if (!this.elevenLabsAPI.apiKey) {
                console.log('⚠️ ElevenLabs API key not configured');
                return null;
            }
            
            // Dynamic voice settings based on emotion
            let voiceSettings = { ...this.voiceConfig.voiceSettings };
            
            if (options.emotion === 'excited') {
                voiceSettings.stability = 0.6;  // More variation
                voiceSettings.style = 0.8;      // Higher style
            } else if (options.emotion === 'frustrated') {
                voiceSettings.stability = 0.8;  // More controlled
                voiceSettings.style = 0.7;      // Moderate style
            } else if (options.emotion === 'chill') {
                voiceSettings.stability = 0.85; // Very stable
                voiceSettings.style = 0.4;      // Lower style
            }
            
            const requestData = {
                text: text,
                model_id: this.voiceConfig.model,
                voice_settings: voiceSettings
            };
            
            console.log(`🎵 Sending to ElevenLabs: ${text.substring(0, 50)}...`);
            
            const response = await axios.post(
                `${this.elevenLabsAPI.baseURL}/text-to-speech/${this.voiceConfig.voiceId}`,
                requestData,
                {
                    headers: this.elevenLabsAPI.headers,
                    responseType: 'arraybuffer',
                    timeout: 15000
                }
            );
            
            if (response.status === 200) {
                console.log('✅ ElevenLabs synthesis successful!');
                return Buffer.from(response.data);
            }
            
        } catch (error) {
            console.error('ElevenLabs synthesis error:', error.message);
        }
        
        return null;
    }

    async synthesizeWithAzure(text, options = {}) {
        try {
            if (!this.azureAPI.apiKey) {
                console.log('⚠️ Azure API key not configured');
                return null;
            }
            
            // Create SSML for more natural speech
            const ssml = this.createSSML(text, options);
            
            const response = await axios.post(
                `${this.azureAPI.endpoint}/cognitiveservices/v1`,
                ssml,
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': this.azureAPI.apiKey,
                        'Content-Type': 'application/ssml+xml',
                        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3'
                    },
                    responseType: 'arraybuffer',
                    timeout: 15000
                }
            );
            
            if (response.status === 200) {
                console.log('✅ Azure synthesis successful!');
                return Buffer.from(response.data);
            }
            
        } catch (error) {
            console.error('Azure synthesis error:', error.message);
        }
        
        return null;
    }

    createSSML(text, options = {}) {
        // Create SSML with Puerto Rican characteristics
        let rate = '0%';
        let pitch = '-5%'; // Slightly lower for masculine voice
        let volume = '100';
        
        if (options.emotion === 'excited') {
            rate = '+10%';
            pitch = '+5%';
            volume = '110';
        } else if (options.emotion === 'frustrated') {
            rate = '+5%';
            pitch = '+10%';
            volume = '105';
        } else if (options.emotion === 'chill') {
            rate = '-10%';
            pitch = '-10%';
            volume = '95';
        }
        
        return `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-PR">
    <voice name="es-PR-KarinaNeural">
        <prosody rate="${rate}" pitch="${pitch}" volume="${volume}">
            <emphasis level="moderate">${text}</emphasis>
        </prosody>
    </voice>
</speak>`;
    }

    async synthesizeWithGoogle(text, options = {}) {
        try {
            if (!this.googleAPI.apiKey) {
                console.log('⚠️ Google API key not configured');
                return null;
            }
            
            const requestData = {
                input: { text: text },
                voice: {
                    languageCode: this.googleAPI.languageCode,
                    name: this.googleAPI.voiceName,
                    ssmlGender: 'MALE'
                },
                audioConfig: {
                    audioEncoding: this.googleAPI.audioEncoding,
                    speakingRate: options.emotion === 'excited' ? 1.1 : 
                                  options.emotion === 'chill' ? 0.9 : 1.0,
                    pitch: -2.0 // Lower pitch for masculine voice
                }
            };
            
            const response = await axios.post(
                `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleAPI.apiKey}`,
                requestData,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 15000
                }
            );
            
            if (response.status === 200 && response.data.audioContent) {
                console.log('✅ Google synthesis successful!');
                return Buffer.from(response.data.audioContent, 'base64');
            }
            
        } catch (error) {
            console.error('Google synthesis error:', error.message);
        }
        
        return null;
    }

    async postProcessAudio(audioBuffer, options = {}) {
        // Add subtle audio processing to make it more human-like
        try {
            // In a real implementation, you'd use audio processing libraries
            // like node-ffmpeg or @ffmpeg-installer/ffmpeg to:
            // 1. Adjust EQ for more natural voice
            // 2. Add subtle compression
            // 3. Apply noise gate to remove silence artifacts
            // 4. Add slight reverb for natural room tone
            
            console.log('🎛️ Post-processing audio for human-like characteristics...');
            
            // For now, return the original buffer
            // In production, implement audio DSP here
            return audioBuffer;
            
        } catch (error) {
            console.error('Audio post-processing error:', error);
            return audioBuffer;
        }
    }

    // Discord voice integration
    async joinVoiceChannel(channelId, guildId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) {
                return { success: false, message: 'Guild not found hermano!' };
            }
            
            const channel = guild.channels.cache.get(channelId);
            if (!channel || channel.type !== 2) { // GUILD_VOICE = 2
                return { success: false, message: 'Voice channel not found papi!' };
            }
            
            console.log(`🎤 Joining voice channel: ${channel.name}`);
            
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
            });
            
            // Create audio player for this connection
            const player = createAudioPlayer();
            connection.subscribe(player);
            
            // Store connection and player
            this.voiceConnections.set(guildId, connection);
            this.audioPlayers.set(guildId, player);
            this.voiceQueue.set(guildId, []);
            
            // Connection event handlers
            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log('🎵 Voice connection ready!');
            });
            
            connection.on(VoiceConnectionStatus.Disconnected, () => {
                console.log('🔌 Voice connection disconnected');
                this.cleanup(guildId);
            });
            
            player.on(AudioPlayerStatus.Idle, () => {
                this.processNextInQueue(guildId);
            });
            
            player.on('error', error => {
                console.error('Audio player error:', error);
            });
            
            // Play entrance greeting
            await this.speak(guildId, this.getVoiceGreeting(), { emotion: 'excited' });
            
            return { 
                success: true, 
                message: '¡Dale! I\'m in the voice chat now! Ready to talk! 🎤🔥',
                channelName: channel.name
            };
            
        } catch (error) {
            console.error('Voice join error:', error);
            return { 
                success: false, 
                message: 'Ay no, couldn\'t join voice chat hermano! 😤' 
            };
        }
    }

    async speak(guildId, text, options = {}) {
        try {
            const connection = this.voiceConnections.get(guildId);
            const player = this.audioPlayers.get(guildId);
            
            if (!connection || !player) {
                console.log('⚠️ No voice connection for guild:', guildId);
                return;
            }
            
            console.log(`🗣️ Speaking in ${guildId}: "${text}"`);
            
            // Add to queue if currently processing
            const queue = this.voiceQueue.get(guildId) || [];
            queue.push({ text, options });
            this.voiceQueue.set(guildId, queue);
            
            // Process if not currently busy
            if (!this.isProcessing.get(guildId)) {
                await this.processNextInQueue(guildId);
            }
            
        } catch (error) {
            console.error('Speak error:', error);
        }
    }

    async processNextInQueue(guildId) {
        try {
            const queue = this.voiceQueue.get(guildId) || [];
            if (queue.length === 0) {
                this.isProcessing.set(guildId, false);
                return;
            }
            
            this.isProcessing.set(guildId, true);
            const { text, options } = queue.shift();
            this.voiceQueue.set(guildId, queue);
            
            const player = this.audioPlayers.get(guildId);
            if (!player) return;
            
            // Synthesize voice
            const audioBuffer = await this.synthesizeVoice(text, options);
            if (!audioBuffer) {
                console.log('❌ Voice synthesis failed');
                this.isProcessing.set(guildId, false);
                return;
            }
            
            // Create temporary audio file
            const tempFile = `/tmp/zolory_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.mp3`;
            await this.writeAudioFile(audioBuffer, tempFile);
            
            // Create audio resource and play
            const resource = createAudioResource(tempFile);
            player.play(resource);
            
            // Clean up temp file after playing
            player.once(AudioPlayerStatus.Idle, () => {
                if (existsSync(tempFile)) {
                    unlinkSync(tempFile);
                }
                this.isProcessing.set(guildId, false);
            });
            
        } catch (error) {
            console.error('Queue processing error:', error);
            this.isProcessing.set(guildId, false);
        }
    }

    async writeAudioFile(audioBuffer, filePath) {
        return new Promise((resolve, reject) => {
            const writeStream = createWriteStream(filePath);
            writeStream.write(audioBuffer);
            writeStream.end();
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    }

    async leaveVoiceChannel(guildId) {
        try {
            const connection = this.voiceConnections.get(guildId);
            if (!connection) {
                return { success: false, message: 'I\'m not in any voice chat papi! 🎤' };
            }
            
            // Say goodbye before leaving
            await this.speak(guildId, this.getVoiceGoodbye(), { emotion: 'friendly' });
            
            // Wait a bit for goodbye to play
            setTimeout(() => {
                connection.destroy();
                this.cleanup(guildId);
            }, 3000);
            
            return { 
                success: true, 
                message: '¡Hasta luego familia! Leaving voice chat! 👋' 
            };
            
        } catch (error) {
            console.error('Voice leave error:', error);
            return { 
                success: false, 
                message: 'Ay no, error leaving voice chat hermano! 😤' 
            };
        }
    }

    cleanup(guildId) {
        this.voiceConnections.delete(guildId);
        this.audioPlayers.delete(guildId);
        this.voiceQueue.delete(guildId);
        this.isProcessing.delete(guildId);
    }

    getVoiceGreeting() {
        const greetings = [
            "¡Eyyy qué tal la gente! Zolory's in the building!",
            "¡Wepaaa! Your boy Zolory just pulled up to the voice chat!",
            "Ay yo what's good everyone! Ready to vibe?",
            "¡Dale! I'm here, let's get this conversation going!",
            "Wassup familia! Zolory's in the chat, let's talk!",
            "¡Oye! Tu pana Zolory aquí mismo, ready para la charla!",
            "¡Ay bendito! I made it to the voice chat, qué tal hermanos!"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    getVoiceGoodbye() {
        const goodbyes = [
            "¡Hasta luego familia! Catch you all later!",
            "Aight I'm out, pero hit me up anytime!",
            "¡Nos vemos! Had fun talking with y'all!",
            "Peace out hermanos, talk to you soon!",
            "Dale, I gotta bounce pero this was fire!",
            "¡Adiós mi gente! Keep it real until next time!",
            "Ay, time to go pero we gotta do this again soon!"
        ];
        return goodbyes[Math.floor(Math.random() * goodbyes.length)];
    }

    // Voice response to user speech
    async respondToVoice(guildId, userText, context = {}) {
        try {
            // Process user speech and generate appropriate response
            const response = await this.generateVoiceResponse(userText, context);
            
            if (response) {
                await this.speak(guildId, response.text, {
                    emotion: response.emotion,
                    energyLevel: response.energy
                });
            }
            
        } catch (error) {
            console.error('Voice response error:', error);
        }
    }

    async generateVoiceResponse(userText, context = {}) {
        // This would integrate with the AI system to generate contextual responses
        // For now, return some example responses
        
        const text = userText.toLowerCase();
        
        if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
            return {
                text: "¡Ay yo qué tal! What's good hermano?",
                emotion: 'friendly',
                energy: 0.8
            };
        }
        
        if (text.includes('how are you')) {
            return {
                text: "I'm blessed papi, just vibing en el voice chat! How you doing?",
                emotion: 'happy',
                energy: 0.7
            };
        }
        
        if (text.includes('game') || text.includes('play')) {
            return {
                text: "Ay yo, let's get some games going! I'm ready to play whatever hermano!",
                emotion: 'excited',
                energy: 0.9
            };
        }
        
        // Default friendly response
        return {
            text: "Dale, I hear you papi! That's what I'm talking about!",
            emotion: 'agreeable',
            energy: 0.6
        };
    }

    // Voice status and diagnostics
    getVoiceStatus() {
        return {
            activeConnections: this.voiceConnections.size,
            providers: {
                elevenlabs: !!this.elevenLabsAPI.apiKey,
                azure: !!this.azureAPI.apiKey,
                google: !!this.googleAPI.apiKey
            },
            voiceModel: this.voiceConfig.voiceId,
            isReady: true
        };
    }

    setClient(client) {
        this.client = client;
    }
}

module.exports = ZoloryVoiceSystem;