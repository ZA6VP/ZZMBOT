#!/usr/bin/env node

console.log('🔍 CHECKING FOR DISCORD TOKEN IN USER SECRETS...\n');

// Check all environment variables for potential Discord tokens
const allEnvVars = process.env;
const tokenCandidates = [];

// Common Discord token patterns
const discordTokenPatterns = [
    /discord/i,
    /bot/i,
    /token/i
];

console.log('📋 All environment variables containing "discord", "bot", or "token":');
console.log('================================================================');

for (const [key, value] of Object.entries(allEnvVars)) {
    const keyLower = key.toLowerCase();
    
    // Check if key matches Discord token patterns
    if (discordTokenPatterns.some(pattern => pattern.test(key))) {
        const valuePreview = value ? (value.length > 20 ? `${value.substring(0, 20)}...` : value) : '(empty)';
        console.log(`🔑 ${key} = ${valuePreview} (length: ${value?.length || 0})`);
        
        // Check if this looks like a valid Discord token
        if (value && value.length > 50 && !value.includes('DEMO_TOKEN')) {
            tokenCandidates.push({ key, value, length: value.length });
        }
    }
}

console.log('\n🎯 POTENTIAL VALID DISCORD TOKENS:');
console.log('==================================');

if (tokenCandidates.length === 0) {
    console.log('❌ No valid Discord tokens found in environment variables');
    console.log('\n💡 Expected token format:');
    console.log('   - Should be 50+ characters long');
    console.log('   - Usually starts with "Bot " or contains dots/hyphens');
    console.log('   - Environment variable names like: DISCORD_TOKEN, DISCORD_BOT_TOKEN, BOT_TOKEN');
} else {
    tokenCandidates.forEach((candidate, index) => {
        console.log(`✅ ${index + 1}. ${candidate.key}:`);
        console.log(`   Length: ${candidate.length} characters`);
        console.log(`   Preview: ${candidate.value.substring(0, 30)}...`);
        console.log(`   Looks valid: ${candidate.length > 50 ? '✅' : '❌'}`);
        console.log('');
    });
}

console.log('\n🚀 NEXT STEPS:');
console.log('==============');
if (tokenCandidates.length > 0) {
    console.log('✅ Found potential Discord token(s)!');
    console.log('🔧 Will use the first valid token to start Zolory...');
} else {
    console.log('❌ No Discord token found in user secrets');
    console.log('📋 Please set one of these environment variables:');
    console.log('   - DISCORD_TOKEN=your_bot_token_here');
    console.log('   - DISCORD_BOT_TOKEN=your_bot_token_here');
    console.log('   - BOT_TOKEN=your_bot_token_here');
}

// Export the best token candidate
if (tokenCandidates.length > 0) {
    process.env.ZOLORY_DISCORD_TOKEN = tokenCandidates[0].value;
    console.log(`\n🎯 Using token from: ${tokenCandidates[0].key}`);
}