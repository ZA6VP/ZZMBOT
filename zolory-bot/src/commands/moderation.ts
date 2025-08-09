import { GuildMember, Message, PermissionsBitField, User } from 'discord.js';
import { detectIntent } from '../nlp/nlu.js';
import { Warnings } from '../storage/db.js';

async function resolveTarget(message: Message, targetFragment?: string): Promise<GuildMember | null> {
  if (!message.guild) return null;
  if (!targetFragment) return null;
  // If fragment is ID
  if (/^\d{15,}$/.test(targetFragment)) {
    try {
      const m = await message.guild.members.fetch(targetFragment);
      return m;
    } catch {
      // ignore
    }
  }
  // Try mentions
  if (message.mentions.members?.size) return message.mentions.members.first() ?? null;
  // Fuzzy by display name or username
  const all = await message.guild.members.fetch();
  const lower = targetFragment.toLowerCase();
  const cand = all.find(m =>
    m.displayName.toLowerCase().includes(lower) || m.user.username.toLowerCase().includes(lower)
  );
  return cand ?? null;
}

function ensureBotAndInvokerPerms(message: Message, needed: bigint): string | null {
  if (!message.guild) return 'This only works in servers.';
  const me = message.guild.members.me;
  if (!me) return 'I cannot check my permissions right now.';
  if (!me.permissions.has(needed)) return 'I lack permissions for that action.';
  const invoker = message.member;
  if (!invoker) return 'Cannot resolve your member permissions.';
  if (!invoker.permissions.has(needed)) return 'You do not have permissions for that action.';
  return null;
}

export async function handleModeration(message: Message): Promise<boolean> {
  const intent = detectIntent(message.content);
  if (!message.guild) return false;
  switch (intent.name) {
    case 'moderation.ban': {
      const permsError = ensureBotAndInvokerPerms(message, PermissionsBitField.Flags.BanMembers);
      if (permsError) {
        await message.reply(permsError);
        return true;
      }
      const target = await resolveTarget(message, intent.target);
      if (!target) {
        await message.reply('Could not find who to ban. Mention or give a clearer name/ID.');
        return true;
      }
      const reason = intent.reason ?? `Requested by ${message.author.tag}`;
      const duration = intent.durationMs;
      try {
        await target.ban({ reason });
        await message.reply(`Banned ${target.user.tag}${duration ? ` for ${Math.round(duration / 1000)}s` : ''}.`);
      } catch (e) {
        await message.reply('Ban failed. I might lack role position or permissions.');
      }
      return true;
    }
    case 'moderation.kick': {
      const permsError = ensureBotAndInvokerPerms(message, PermissionsBitField.Flags.KickMembers);
      if (permsError) {
        await message.reply(permsError);
        return true;
      }
      const target = await resolveTarget(message, intent.target);
      if (!target) {
        await message.reply('Could not find who to kick. Mention or give a clearer name/ID.');
        return true;
      }
      const reason = intent.reason ?? `Requested by ${message.author.tag}`;
      try {
        await target.kick(reason);
        await message.reply(`Kicked ${target.user.tag}.`);
      } catch (e) {
        await message.reply('Kick failed. I might lack role position or permissions.');
      }
      return true;
    }
    case 'moderation.timeout': {
      const permsError = ensureBotAndInvokerPerms(message, PermissionsBitField.Flags.ModerateMembers);
      if (permsError) {
        await message.reply(permsError);
        return true;
      }
      const target = await resolveTarget(message, intent.target);
      if (!target) {
        await message.reply('Could not find who to timeout. Mention or give a clearer name/ID.');
        return true;
      }
      const ms = intent.durationMs ?? 10 * 60 * 1000;
      try {
        await target.timeout(ms, intent.reason ?? `Requested by ${message.author.tag}`);
        await message.reply(`Timed out ${target.user.tag} for ${Math.round(ms / 60000)}m.`);
      } catch (e) {
        await message.reply('Timeout failed. I might lack role position or permissions.');
      }
      return true;
    }
    case 'moderation.warn': {
      if (!message.member) return true;
      const target = await resolveTarget(message, intent.target);
      if (!target) {
        await message.reply('Could not find who to warn. Mention or give a clearer name/ID.');
        return true;
      }
      const warn = {
        guildId: message.guild!.id,
        userId: target.id,
        moderatorId: message.author.id,
        reason: intent.reason ?? 'No reason provided',
        createdAt: Date.now(),
      };
      Warnings.add(warn);
      await message.reply(`Warned ${target.user.tag}: ${warn.reason}`);
      return true;
    }
    default:
      return false;
  }
}