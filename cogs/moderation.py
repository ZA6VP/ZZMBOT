import re
import discord
from discord.ext import commands
from dateutil import parser as date_parser
from datetime import timedelta

BAN_REGEX = re.compile(r"(?:ban)\s+(<@!?(?P<id>\d+)>|(?P<name>\S+))", re.I)
KICK_REGEX = re.compile(r"(?:kick)\s+(<@!?(?P<id>\d+)>|(?P<name>\S+))", re.I)
TIMEOUT_REGEX = re.compile(r"(?:timeout|mute)\s+(<@!?(?P<id>\d+)>|(?P<name>\S+))\s+for\s+(?P<dur>\S+)", re.I)
WARN_REGEX = re.compile(r"(?:warn)\s+(<@!?(?P<id>\d+)>|(?P<name>\S+))", re.I)

DURATION_MAPPING = {
    "s": 1,
    "m": 60,
    "h": 3600,
    "d": 86400,
}


class ModerationCog(commands.Cog):
    """Cog providing moderation via natural language."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener("on_message")
    async def parse_mod(self, message: discord.Message):
        if message.author.bot:
            return
        content = message.content.lower()

        if BAN_REGEX.search(content):
            await self._handle_ban(message)
        elif KICK_REGEX.search(content):
            await self._handle_kick(message)
        elif TIMEOUT_REGEX.search(content):
            await self._handle_timeout(message)
        elif WARN_REGEX.search(content):
            await self._handle_warn(message)

    async def _resolve_member(self, guild: discord.Guild, id_or_name: str):
        # Try mention id first
        if id_or_name.isdigit():
            member = guild.get_member(int(id_or_name))
            if member:
                return member
        # Fallback search by display name or name
        id_or_name = id_or_name.lower()
        for member in guild.members:
            if member.display_name.lower() == id_or_name or member.name.lower() == id_or_name:
                return member
        return None

    async def _handle_ban(self, message: discord.Message):
        match = BAN_REGEX.search(message.content)
        if not match:
            return
        target_id = match.group("id") or match.group("name")
        member = await self._resolve_member(message.guild, target_id)
        if not member:
            await message.reply("Couldn't find that user, jefe.")
            return
        reason = message.content.split("because", 1)[-1].strip() if "because" in message.content else None
        await member.ban(reason=reason)
        await message.reply(f"👢 Banned {member.display_name}.")

    async def _handle_kick(self, message: discord.Message):
        match = KICK_REGEX.search(message.content)
        if not match:
            return
        target_id = match.group("id") or match.group("name")
        member = await self._resolve_member(message.guild, target_id)
        if not member:
            await message.reply("Couldn't find that user.")
            return
        await member.kick(reason="Kicked via natural language command")
        await message.reply(f"🚪 Kicked {member.display_name}.")

    async def _handle_timeout(self, message: discord.Message):
        match = TIMEOUT_REGEX.search(message.content)
        if not match:
            return
        target_id = match.group("id") or match.group("name")
        duration_str = match.group("dur")
        member = await self._resolve_member(message.guild, target_id)
        if not member:
            await message.reply("Can't find user to timeout.")
            return
        seconds = self._parse_duration(duration_str)
        if seconds is None:
            await message.reply("Bad duration, homie.")
            return
        until = discord.utils.utcnow() + timedelta(seconds=seconds)
        try:
            await member.timeout(until, reason="Timeout via Zolory")
            await message.reply(f"⏲️ Timed out {member.display_name} for {duration_str}.")
        except Exception:
            await message.reply("Failed to timeout user.")

    async def _handle_warn(self, message: discord.Message):
        match = WARN_REGEX.search(message.content)
        if not match:
            return
        target_id = match.group("id") or match.group("name")
        member = await self._resolve_member(message.guild, target_id)
        if not member:
            await message.reply("Can't find user to warn.")
            return
        await message.reply(f"⚠️ Hey {member.mention}, chill out or face the chancla!")

    def _parse_duration(self, token: str):
        try:
            num_part = "".join(ch for ch in token if ch.isdigit())
            unit = token[-1]
            seconds = int(num_part) * DURATION_MAPPING.get(unit, 0)
            return seconds if seconds > 0 else None
        except Exception:
            return None


async def setup(bot: commands.Bot):
    await bot.add_cog(ModerationCog(bot))