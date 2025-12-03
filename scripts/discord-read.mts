#!/usr/bin/env tsx
/**
 * Discord Read Script - Read messages from dev-team channel
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

async function main() {
  const token = loadDiscordToken();
  
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once('ready', async () => {
    console.log(`✅ Connected as ${client.user?.tag}\n`);
    
    const channel = await client.channels.fetch(DEV_TEAM_CHANNEL_ID) as TextChannel;
    console.log(`📖 Reading from: #${channel.name}\n`);
    
    // Fetch recent messages
    const messages = await channel.messages.fetch({ limit: 20 });
    
    console.log(`Found ${messages.size} recent messages:\n`);
    console.log('═'.repeat(80));
    
    messages.reverse().forEach((msg) => {
      console.log(`\n[${msg.createdAt.toLocaleString()}] ${msg.author.tag}:`);
      console.log(msg.content || '(no text content)');
      console.log('-'.repeat(80));
    });
    
    client.destroy();
  });

  await client.login(token);
}

main().catch(console.error);
