#!/usr/bin/env tsx
/**
 * Discord Service
 *
 * Provides utilities for reading and writing Discord messages
 * Can be used directly or via command line
 */

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

if (!DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN not set');
  process.exit(1);
}

if (!DISCORD_GUILD_ID) {
  console.error('❌ DISCORD_GUILD_ID not set');
  process.exit(1);
}

if (!DISCORD_CHANNEL_ID) {
  console.error('❌ DISCORD_CHANNEL_ID not set');
  process.exit(1);
}

/**
 * Initialize Discord client
 */
export const createDiscordClient = (): Client => {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
};

/**
 * Read recent messages from dev-team channel
 */
export const readMessages = async (limit = 10): Promise<void> => {
  const client = createDiscordClient();

  try {
    await client.login(DISCORD_BOT_TOKEN);
    console.log('✅ Connected to Discord');

    const guild = await client.guilds.fetch(DISCORD_GUILD_ID!);
    const channel = (await guild.channels.fetch(DISCORD_CHANNEL_ID!)) as TextChannel;

    if (!channel || !channel.isTextBased()) {
      throw new Error('Channel not found or not a text channel');
    }

    console.log(`\n📖 Last ${limit} messages from #${channel.name}:\n`);

    const messages = await channel.messages.fetch({ limit });

    messages.reverse().forEach((msg) => {
      const timestamp = msg.createdAt.toLocaleString();
      const author = msg.author.bot ? `${msg.author.username} [BOT]` : msg.author.username;
      console.log(`[${timestamp}] ${author}:`);
      console.log(`  ${msg.content || '<no content>'}`);
      if (msg.attachments.size > 0) {
        console.log(`  📎 Attachments: ${msg.attachments.size}`);
      }
      console.log('');
    });

    await client.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    await client.destroy();
    process.exit(1);
  }
};

/**
 * Send a message to dev-team channel
 */
export const sendMessage = async (content: string): Promise<void> => {
  const client = createDiscordClient();

  try {
    await client.login(DISCORD_BOT_TOKEN);
    console.log('✅ Connected to Discord');

    const guild = await client.guilds.fetch(DISCORD_GUILD_ID!);
    const channel = (await guild.channels.fetch(DISCORD_CHANNEL_ID!)) as TextChannel;

    if (!channel || !channel.isTextBased()) {
      throw new Error('Channel not found or not a text channel');
    }

    await channel.send(content);
    console.log(`✅ Message sent to #${channel.name}`);

    await client.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    await client.destroy();
    process.exit(1);
  }
};

/**
 * CLI interface
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'read': {
      const limit = arg ? parseInt(arg, 10) : 10;
      await readMessages(limit);
      break;
    }
    case 'send': {
      if (!arg) {
        console.error('❌ Usage: discord-service.ts send "message content"');
        process.exit(1);
      }
      await sendMessage(arg);
      break;
    }
    default:
      console.log(`
Discord Service - Read and write to dev-team channel

Usage:
  tsx scripts/discord-service.ts read [limit]     Read recent messages (default: 10)
  tsx scripts/discord-service.ts send "message"   Send a message

Examples:
  tsx scripts/discord-service.ts read 20
  tsx scripts/discord-service.ts send "Deployment complete! 🚀"

Environment variables required:
  DISCORD_BOT_TOKEN   - Bot token from Discord Developer Portal
  DISCORD_GUILD_ID    - Server ID
  DISCORD_CHANNEL_ID  - Channel ID for dev-team
`);
      process.exit(command ? 1 : 0);
  }
}
