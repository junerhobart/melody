import { useQueue } from 'discord-player';
import { SlashCommandBuilder } from 'discord.js';

import { MSG, replyEphemeral } from '../lib/ephemeral';
import type { Command } from './types';

const MAX_LISTED_TRACKS = 10;

export const queue: Command = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show queue'),

  async execute(interaction) {
    const guildQueue = useQueue(interaction.guildId);
    if (!guildQueue) {
      return replyEphemeral(interaction, MSG.queueEmpty);
    }

    const current = guildQueue.currentTrack;
    const upcoming = guildQueue.tracks.toArray();
    if (!current && upcoming.length === 0) {
      return replyEphemeral(interaction, MSG.queueEmpty);
    }

    const lines: string[] = [];
    if (current) {
      lines.push(`> ${current.title} (${current.duration})`);
    }
    if (upcoming.length > 0) {
      lines.push(
        ...upcoming
          .slice(0, MAX_LISTED_TRACKS)
          .map((track, index) => `${index + 1}. ${track.title} (${track.duration})`),
      );
      if (upcoming.length > MAX_LISTED_TRACKS) {
        lines.push(`+ ${upcoming.length - MAX_LISTED_TRACKS} more`);
      }
    }

    return replyEphemeral(interaction, lines.join('\n'));
  },
};
