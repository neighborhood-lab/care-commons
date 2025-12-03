#!/usr/bin/env tsx
/**
 * Discord Post Script - Post message to dev-team channel
 */

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

const DISCORD_SECRETS_PATH = path.join(process.cwd(), '.discord-secrets');
const DEV_TEAM_CHANNEL_ID = '1443596956256571434';

function loadDiscordToken(): string {
  const secrets = fs.readFileSync(DISCORD_SECRETS_PATH, 'utf-8');
  const match = secrets.match(/DISCORD_BOT_TOKEN=(.+)/);
  if (!match) throw new Error('DISCORD_BOT_TOKEN not found');
  return match[1].trim();
}

async function postMessage(message: string) {
  const token = loadDiscordToken();
  
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ],
  });

  client.once('ready', async () => {
    const channel = await client.channels.fetch(DEV_TEAM_CHANNEL_ID) as TextChannel;
    await channel.send(message);
    console.log(`✅ Message posted to #${channel.name}`);
    client.destroy();
  });

  await client.login(token);
}

const message = process.argv[2] || `## Gaute - Status Update (${new Date().toLocaleTimeString()})

Test message from discord-post script.`;

postMessage(message).catch(console.error);
