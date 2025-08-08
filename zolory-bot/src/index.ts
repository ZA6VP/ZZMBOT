import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { logger } from './utils/logger.js';
import { registerReady } from './handlers/ready.js';
import { registerMessageCreate } from './handlers/messageCreate.js';

const token = process.env.DISCORD_TOKEN;
if (!token) {
  logger.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

registerReady(client);
registerMessageCreate(client);

client.login(token).then(() => logger.info('Zolory is online.')).catch(err => {
  logger.error('Failed to login', err);
  process.exit(1);
});