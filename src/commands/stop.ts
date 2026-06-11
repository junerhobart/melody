import { useQueue } from 'discord-player';
import { SlashCommandBuilder } from 'discord.js';

import { MSG, replyEphemeral } from '../lib/ephemeral';
import { canControlPlayback } from '../lib/permissions';
import type { Command } from './types';

export const stop: Command = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop and clear queue (admin or track requester)'),

  async execute(interaction) {
    const queue = useQueue(interaction.guildId);
    if (!queue) {
      return replyEphemeral(interaction, MSG.queueEmpty);
    }

    if (!canControlPlayback(queue, interaction.member)) {
      return replyEphemeral(interaction, MSG.notYourTrackStop);
    }

    queue.delete();
    return replyEphemeral(interaction, MSG.playbackStopped);
  },
};
