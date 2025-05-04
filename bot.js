import express from 'express';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// Get the current directory in ES module mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioFilePath = path.join(__dirname, 'clip1.mp3');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

const donnieEnabled = new Map();

client.on('messageCreate', async (message) => {
  if (message.channel.name !== 'bot-commands' || message.author.bot) return;

  const args = message.content.trim().split(/\s+/);
  if (args[0] === '!donnie') {
    const setting = args[1]?.toLowerCase();
    if (setting === 'on') {
      donnieEnabled.set(message.guild.id, true);
      message.reply('ENABLED');
    } else if (setting === 'off') {
      donnieEnabled.set(message.guild.id, false);
      message.reply('DISABLED');
    } else {
      message.reply('Usage: `!donnie on` or `!donnie off`');
    }
  }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  const guildId = newState.guild.id;
  if (!donnieEnabled.get(guildId)) return;

  const member = newState.member;
  if (!member || member.user.bot || !newState.channel || oldState.channel === newState.channel) return;

  const connection = joinVoiceChannel({
    channelId: newState.channel.id,
    guildId: newState.guild.id,
    adapterCreator: newState.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  const player = createAudioPlayer();
  connection.subscribe(player);

  const receiver = connection.receiver;

  receiver.speaking.on('start', (userId) => {
    const user = newState.guild.members.cache.get(userId);
    if (user && !user.user.bot && player.state.status !== AudioPlayerStatus.Playing) {
      const resource = createAudioResource(audioFilePath);
      player.play(resource);
    }
  });

  // Leave after inactivity or disable
  const cleanupInterval = setInterval(() => {
    // Add a check to ensure `newState.channel` is valid
    if (!donnieEnabled.get(guildId) || !newState.channel || newState.channel.members.size <= 1) {
      connection.destroy();
      clearInterval(cleanupInterval);
    }
  }, 5000);
});


client.login(process.env.DCTOKEN);
