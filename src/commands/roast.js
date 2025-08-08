const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'roast',
    aliases: ['insult', 'burn'],
    description: 'Roast a user (in good fun!)',
    async execute(message, args) {
        const { client } = message;
        
        let target = message.author;
        
        if (args.length > 0) {
            const targetUser = args.join(' ');
            const mentionedUser = message.mentions.users.first();
            
            if (mentionedUser) {
                target = mentionedUser;
            } else {
                // Try to find user by name
                const member = message.guild.members.cache.find(m => 
                    m.displayName.toLowerCase().includes(targetUser.toLowerCase()) ||
                    m.user.username.toLowerCase().includes(targetUser.toLowerCase())
                );
                if (member) {
                    target = member.user;
                }
            }
        }

        // Don't roast the owner
        if (target.id === client.config.ownerId) {
            await message.reply("Yo, I can't roast my owner! That's disrespectful! 😤");
            return;
        }

        // Don't roast yourself if no target specified
        if (target.id === message.author.id && args.length === 0) {
            await message.reply("Yo, you want me to roast you? That's self-harm fam! 😅");
            return;
        }

        const roasts = [
            `Yo ${target.displayName}, your coding skills are so bad, even a calculator would be embarrassed to be associated with you! 💀`,
            `${target.displayName}, you're so slow, you make dial-up internet look fast! 🐌`,
            `Yo ${target.displayName}, your jokes are so old, they were written in COBOL! 😂`,
            `${target.displayName}, you're so basic, you probably think JavaScript is a coffee brand! ☕`,
            `Yo ${target.displayName}, your personality is like a 404 error - not found! 🔍`,
            `${target.displayName}, you're so irrelevant, even a null pointer exception would ignore you! 🎯`,
            `Yo ${target.displayName}, your brain is like a stack overflow - too much recursion, not enough logic! 🧠`,
            `${target.displayName}, you're so predictable, even a random number generator could guess your next move! 🎲`,
            `Yo ${target.displayName}, your social skills are like a broken API - no response! 📡`,
            `${target.displayName}, you're so outdated, you probably still use Internet Explorer! 🌐`
        ];

        const roast = roasts[Math.floor(Math.random() * roasts.length)];
        const emoji = client.gifManager.getMoodEmoji('playful');

        const embed = new EmbedBuilder()
            .setTitle('🔥 Roast Session!')
            .setColor('#ff6b6b')
            .setDescription(`${emoji} **${roast}**`)
            .addFields(
                { name: '🎯 Target', value: target.displayName, inline: true },
                { name: '🔥 Roasted by', value: client.config.botPersonality.name, inline: true },
                { name: '😈 Intensity', value: 'Savage', inline: true }
            )
            .setThumbnail(target.displayAvatarURL())
            .setFooter({ text: 'All in good fun! 😄' })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};