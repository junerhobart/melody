import { useQueue, type GuildQueue } from 'discord-player';
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { MSG, replyEphemeral } from '../lib/ephemeral';
import { canControlPlayback } from '../lib/permissions';
import type { Command } from './types';

const CURRENT_TRACK = 'current';
const MAX_CHOICES = 25;
const MAX_CHOICE_NAME = 100;

function trimName(name: string): string {
  return name.length > MAX_CHOICE_NAME ? `${name.slice(0, MAX_CHOICE_NAME - 1)}…` : name;
}

function skippableChoices(
  queue: GuildQueue,
  userId: string,
  isAdmin: boolean,
): { name: string; value: string }[] {
  const choices: { name: string; value: string }[] = [];

  const current = queue.currentTrack;
  if (current && (isAdmin || current.requestedBy?.id === userId)) {
    choices.push({ name: trimName(`> ${current.title}`), value: CURRENT_TRACK });
  }

  queue.tracks.toArray().forEach((track, index) => {
    if (!isAdmin && track.requestedBy?.id !== userId) return;
    choices.push({ name: trimName(`${index + 1}. ${track.title}`), value: track.id });
  });

  return choices.slice(0, MAX_CHOICES);
}

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
    const search = interaction.options.getFocused().toLowerCase();
    const choices = skippableChoices(queue, interaction.user.id, isAdmin).filter((choice) =>
      choice.name.toLowerCase().includes(search),
    );
    return interaction.respond(choices);
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
