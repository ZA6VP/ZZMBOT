import { ChannelType, GuildMember, Message } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, getVoiceConnection } from '@discordjs/voice';
import { synthesizeSpeech } from '../skills/ttsClient.js';
import { isOwner } from '../config/persona.js';

const guildPlayers: Map<string, ReturnType<typeof createAudioPlayer>> = new Map();

async function ensureConnection(message: Message, channelName?: string) {
  if (!message.guild) return null;
  let voiceChannel = message.member?.voice.channel;
  if (!voiceChannel && channelName) {
    const found = message.guild.channels.cache.find(c => c.type === ChannelType.GuildVoice && c.name.toLowerCase().includes(channelName.toLowerCase()));
    if (found && found.isVoiceBased()) voiceChannel = found as any;
  }
  if (!voiceChannel || !voiceChannel.isVoiceBased()) return null;
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
  } catch {
    connection.destroy();
    return null;
  }
  if (!guildPlayers.has(message.guild.id)) {
    const player = createAudioPlayer();
    guildPlayers.set(message.guild.id, player);
    connection.subscribe(player);
  }
  return connection;
}

export async function handleVoiceJoin(message: Message, channelName?: string) {
  const conn = await ensureConnection(message, channelName);
  if (!conn) {
    await message.reply('I couldn’t join that VC. Make sure I have permissions and you’re in a voice channel.');
  } else {
    await message.reply('Pulled up to VC.');
  }
}

export async function handleVoiceLeave(message: Message) {
  if (!message.guild) return;
  const conn = getVoiceConnection(message.guild.id);
  if (!conn) {
    await message.reply('I’m not in a VC.');
    return;
  }
  conn.destroy();
  guildPlayers.delete(message.guild.id);
  await message.reply('Dipped from VC.');
}

export async function handleVoiceSay(message: Message, text: string) {
  if (!message.guild) return;
  const conn = getVoiceConnection(message.guild.id) || (await ensureConnection(message));
  if (!conn) {
    await message.reply('I need to be in a VC to talk. Ask me to join first.');
    return;
  }
  const audio = await synthesizeSpeech(text);
  if (!audio) {
    await message.reply('TTS isn’t configured on my server. Set AI_BASE_URL with a /v1/tts endpoint.');
    return;
  }
  const player = guildPlayers.get(message.guild.id)!;
  const resource = createAudioResource(audio);
  player.play(resource);
  await message.reply('Say less. Speaking now.');
}