import logging
import re
import random
from datetime import datetime

import discord
from discord.ext import commands

from utils.gemini_client import chat_completion
from utils.helpers import random_gif, random_emoji

NAME_REGEX = re.compile(r"(?i)\b(?:zolory|<@!?\d+>)\b")

MOOD_RESPONSES = {
    "happy": ["I'm vibing today! {}", "Feelin' good, {}!"],
    "angry": ["Bruh, watch your mouth. {}", "Yo chill {}, before I roast you."]
}


class ConversationCog(commands.Cog):
    """Cog handling natural conversations with Zolory."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    # Listen to all messages
    @commands.Cog.listener("on_message")
    async def handle_message(self, message: discord.Message):
        if message.author.bot:
            return

        # Check if Zolory was mentioned by name or ping
        if not NAME_REGEX.search(message.content):
            return  # Ignore messages not directed at bot

        await self.process_chat(message)

    async def process_chat(self, message: discord.Message):
        user_name = message.author.display_name

        # Build history with last 10 messages in channel for context
        history = []
        async for msg in message.channel.history(limit=10, oldest_first=False):
            role = "assistant" if msg.author == self.bot.user else "user"
            history.append({"role": role, "content": msg.content})
        history.reverse()

        prompt_messages = history + [
            {"role": "user", "content": message.content},
        ]

        try:
            reply = await self.bot.loop.run_in_executor(
                None, chat_completion, prompt_messages
            )
            # Basic profanity filter toggle: if user swore, allow response to swear
            if any(word in message.content.lower() for word in ["fuck", "shit", "bitch"]):
                reply += 
" 😤"
        except Exception as e:
            logging.exception("Gemini error: %s", e)
            reply = "My brain trippin', run that back bro. " + random_emoji()

        # Randomly attach gif or emoji
        if random.random() < 0.2:
            reply += "\n" + random_gif()

        await message.reply(reply, mention_author=False)


async def setup(bot: commands.Bot):
    await bot.add_cog(ConversationCog(bot))