import { useQueue } from 'discord-player';
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { MSG, replyEphemeral } from '../lib/ephemeral';
import { canControlPlayback } from '../lib/permissions';
import { CURRENT_TRACK, filterChoices, trackChoices } from '../lib/track-choices';
import type { Command } from './types';

export const skip: Command = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip current track or remove a queued song')
    .addStringOption((option) =>
      option
        .setName('song')
        .setDescription('Song to skip (default: current)')
        .setAutocomplete(true),
    ),

  async autocomplete(interaction) {
    const queue = useQueue(interaction.guildId);
    if (!queue) {
      return interaction.respond([]);
    }

    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;
    const choices = trackChoices(
      queue,
      (track) => isAdmin || track.requestedBy?.id === interaction.user.id,
    );
    return interaction.respond(filterChoices(choices, interaction.options.getFocused()));
  },

  async execute(interaction) {
    const queue = useQueue(interaction.guildId);
    const current = queue?.currentTrack;
    if (!queue || !current) {
      return replyEphemeral(interaction, MSG.queueEmpty);
    }

    const songId = interaction.options.getString('song');

    if (!songId || songId === CURRENT_TRACK) {
      if (!canControlPlayback(queue, interaction.member)) {
        return replyEphemeral(interaction, MSG.notYourTrackSkip);
      }
      queue.node.skip();
      return replyEphemeral(interaction, `Skipped: ${current.title}`);
    }

    const track = queue.tracks.toArray().find((queued) => queued.id === songId);
    if (!track) {
      return replyEphemeral(interaction, MSG.songNotFound);
    }

    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!isAdmin && track.requestedBy?.id !== interaction.user.id) {
      return replyEphemeral(interaction, MSG.notYourSong);
    }

    queue.removeTrack(track);
    return replyEphemeral(interaction, `Removed: ${track.title}`);
  },
};
