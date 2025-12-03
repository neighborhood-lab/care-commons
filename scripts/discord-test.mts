#!/usr/bin/env tsx
/**
 * Discord Test Script
 * Tests connection to dev-team channel
 */

import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

const DISCORD_SECRETS_PATH = path.join(process.cwd(), '.discord-secrets');

function loadDiscordToken(): string {
  const secrets = fs.readFileSync(DISCORD_SECRETS_PATH, 'utf-8');
  const match = secrets.match(/DISCORD_BOT_TOKEN=(.+)/);
  if (!match) throw new Error('DISCORD_BOT_TOKEN not found in .discord-secrets');
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
    console.log(`✅ Logged in as ${client.user?.tag}`);
    
    // Find dev-team channel
    const channels = client.channels.cache;
    console.log(`\n📋 Available channels (${channels.size}):`);
    
    channels.forEach((channel) => {
      if (channel.isTextBased()) {
        const textChannel = channel as TextChannel;
        console.log(`  - ${textChannel.name} (ID: ${textChannel.id})`);
      }
    });
    
    // Look for dev-team channel
    const devTeamChannel = channels.find(
      (ch) => ch.isTextBased() && (ch as TextChannel).name === 'dev-team'
    ) as TextChannel | undefined;
    
    if (devTeamChannel) {
      console.log(`\n✅ Found dev-team channel: ${devTeamChannel.id}`);
      
      // Send test message
      const message = `## Gaute - Discord Test (${new Date().toLocaleTimeString()})

✅ Successfully connected to Discord!

**Morning Summary:**
- 10 major deliverables completed in 2h 15min
- Platform confirmed PRODUCTION READY for Dec 1 launch
- All marketing materials prepared
- Visual verification complete (23 pages, no bugs)

**Key Deliverables:**
1. Demo video script
2. Social media posts (all platforms)
3. Substack publishing checklist
4. Launch day checklist (hour-by-hour)
5. Visual verification report
6. README updates
7. Production screenshots captured

Ready to communicate via Discord! 🚀`;
      
      await devTeamChannel.send(message);
      console.log('\n✅ Test message sent to dev-team channel');
    } else {
      console.log('\n⚠️  dev-team channel not found');
      console.log('Available text channels:');
      channels.forEach((channel) => {
        if (channel.isTextBased()) {
          console.log(`  - ${(channel as TextChannel).name}`);
        }
      });
    }
    
    client.destroy();
    console.log('\n👋 Disconnected from Discord');
  });

  client.login(token);
}

main().catch(console.error);
