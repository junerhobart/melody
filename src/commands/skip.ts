import { useQueue } from 'discord-player';
import { SlashCommandBuilder } from 'discord.js';

import { MSG, replyEphemeral } from '../lib/ephemeral';
import { canControlPlayback } from '../lib/permissions';
import type { Command } from './types';

export const skip: Command = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip current track (admin or track requester)'),

  async execute(interaction) {
    const queue = useQueue(interaction.guildId);
    const current = queue?.currentTrack;
    if (!queue || !current) {
      return replyEphemeral(interaction, MSG.queueEmpty);
    }

    if (!canControlPlayback(queue, interaction.member)) {
      return replyEphemeral(interaction, MSG.notYourTrackSkip);
    }

    queue.node.skip();
    return replyEphemeral(interaction, `Skipped: ${current.title}`);
  },
};
