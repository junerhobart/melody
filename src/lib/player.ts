import { Player } from 'discord-player';
import type { Client } from 'discord.js';

import { registerExtractors } from './extractors';
import { resolveFfmpegPath } from './ffmpeg';
import { clearLoop, handleLoopFinish } from './loops';
import { endAllPolls, endPoll } from './polls';

function attachPlayerEvents(player: Player): void {
  player.events.on('playerStart', (_queue, track) => {
    console.log(`[play] ${track.title}`);
  });

  player.events.on('playerFinish', (queue, track) => {
    endPoll(queue.guild.id, 'skip');
    handleLoopFinish(queue, track);
    console.log(`[finish] ${track.title}`);
  });

  player.events.on('emptyQueue', (queue) => {
    endAllPolls(queue.guild.id);
    clearLoop(queue.guild.id);
    console.log(`[empty] guild ${queue.guild.id}`);
  });

  player.events.on('queueDelete', (queue) => {
    endAllPolls(queue.guild.id);
    clearLoop(queue.guild.id);
  });

  player.events.on('disconnect', (queue) => {
    endAllPolls(queue.guild.id);
    clearLoop(queue.guild.id);
    console.log(`[disconnect] guild ${queue.guild.id}`);
  });

  player.events.on('playerError', (_queue, error, track) => {
    console.error(`[stream error] ${track.title}: ${error.message}`);
  });

  player.events.on('error', (_queue, error) => {
    console.error(`[queue error] ${error.message}`);
  });
}

export async function createPlayer(client: Client): Promise<Player> {
  const ffmpegPath = resolveFfmpegPath();
  if (ffmpegPath) {
    console.log(`[deps] ffmpeg: ${ffmpegPath}`);
  } else {
    console.warn('[deps] ffmpeg-static binary not found');
  }

  const player = new Player(client, {
    connectionTimeout: 60_000,
    ...(ffmpegPath ? { ffmpegPath } : {}),
  });

  await registerExtractors(player);
  attachPlayerEvents(player);

  return player;
}
