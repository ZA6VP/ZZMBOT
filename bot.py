import asyncio
import logging
import os
import random
from datetime import datetime, timedelta

import discord
from discord.ext import commands, tasks
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
OWNER_ID = int(os.getenv("OWNER_ID", "0"))

logging.basicConfig(level=logging.INFO)

intents = discord.Intents.default()
intents.messages = True
intents.message_content = True
intents.guilds = True
intents.members = True
intents.reactions = True

bot = commands.Bot(command_prefix=commands.when_mentioned_or("!"), intents=intents, help_command=None)


@bot.event
async def on_ready():
    logging.info(f"Logged in as {bot.user} (ID: {bot.user.id})")
    if not mood_updater.is_running():
        mood_updater.start()


@tasks.loop(hours=1)
async def mood_updater():
    """Changes the bot's presence to simulate moods and naps."""
    moods = [
        ("Chilling", discord.Status.online),
        ("Taking a nap", discord.Status.idle),
        ("Zzz...", discord.Status.do_not_disturb),
        ("Coding some fire", discord.Status.online),
        ("Roasting fools", discord.Status.online),
    ]
    activity_text, status = random.choice(moods)
    await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.playing, name=activity_text), status=status)


# Cog loader
INITIAL_COGS = [
    "cogs.conversation",
    "cogs.moderation",
    "cogs.games",
]


async def load_cogs():
    for ext in INITIAL_COGS:
        try:
            await bot.load_extension(ext)
            logging.info(f"Loaded extension {ext}")
        except Exception as e:
            logging.exception(f"Failed to load extension {ext}: {e}")


def main():
    if not TOKEN:
        raise RuntimeError("DISCORD_TOKEN not set in environment.")

    async def runner():
        await load_cogs()
        await bot.start(TOKEN)

    try:
        asyncio.run(runner())
    except KeyboardInterrupt:
        logging.info("Shutting down...")


if __name__ == "__main__":
    main()