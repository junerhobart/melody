import { useQueue } from 'discord-player';
import { SlashCommandBuilder } from 'discord.js';

import { MSG, replyEphemeral } from '../lib/ephemeral';
import { isInBotVoiceChannel } from '../lib/permissions';
import { createPoll, hasPoll } from '../lib/polls';
import type { Command } from './types';

export const voteskip: Command = {
  data: new SlashCommandBuilder()
    .setName('voteskip')
    .setDescription('Start a poll to skip the current track (50% of voice channel)'),

  async execute(interaction) {
    const queue = useQueue(interaction.guildId);
    const current = queue?.currentTrack;
    if (!queue || !current) {
      return replyEphemeral(interaction, MSG.queueEmpty);
    }

    if (!isInBotVoiceChannel(queue, interaction.member)) {
      return replyEphemeral(interaction, MSG.joinBotVoice);
    }

    if (hasPoll(interaction.guildId, 'skip')) {
      return replyEphemeral(interaction, MSG.pollRunning);
    }

    const channel = interaction.channel;
    if (!channel?.isSendable()) {
      return replyEphemeral(interaction, MSG.pollFailed);
    }

    try {
      await createPoll(channel, interaction.guildId, 'skip', `Skip: ${current.title}?`);
    } catch {
      return replyEphemeral(interaction, MSG.pollFailed);
    }
    return replyEphemeral(interaction, MSG.pollCreated);
  },
};
