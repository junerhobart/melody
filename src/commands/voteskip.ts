import { useQueue } from 'discord-player';
import { SlashCommandBuilder } from 'discord.js';

import { MSG, replyEphemeral } from '../lib/ephemeral';
import { isInBotVoiceChannel } from '../lib/permissions';
import { createPoll, hasPoll } from '../lib/polls';
import { CURRENT_TRACK, filterChoices, trackChoices } from '../lib/track-choices';
import type { Command } from './types';

export const voteskip: Command = {
  data: new SlashCommandBuilder()
    .setName('voteskip')
    .setDescription('Start a poll to skip a song (50% of voice channel)')
    .addStringOption((option) =>
      option
        .setName('song')
        .setDescription('Song to vote on (default: current)')
        .setAutocomplete(true),
    ),

  async autocomplete(interaction) {
    const queue = useQueue(interaction.guildId);
    if (!queue) {
      return interaction.respond([]);
    }

    const choices = trackChoices(queue, () => true);
    return interaction.respond(filterChoices(choices, interaction.options.getFocused()));
  },

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

    const songId = interaction.options.getString('song');
    let target = current;
    let trackId: string | undefined;

    if (songId && songId !== CURRENT_TRACK) {
      const queued = queue.tracks.toArray().find((track) => track.id === songId);
      if (!queued) {
        return replyEphemeral(interaction, MSG.songNotFound);
      }
      target = queued;
      trackId = queued.id;
    }

    const channel = interaction.channel;
    if (!channel?.isSendable()) {
      return replyEphemeral(interaction, MSG.pollFailed);
    }

    try {
      await createPoll(channel, interaction.guildId, 'skip', `Skip: ${target.title}?`, trackId);
    } catch {
      return replyEphemeral(interaction, MSG.pollFailed);
    }
    return replyEphemeral(interaction, MSG.pollCreated);
  },
};
