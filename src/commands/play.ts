import { useMainPlayer, useQueue, type GuildQueue, type Player, type Track } from 'discord-player';
import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type User,
  type VoiceBasedChannel,
} from 'discord.js';

import { deferEphemeral, MSG, replyEphemeral } from '../lib/ephemeral';
import { resolvePlayQuery, type ResolvedQuery } from '../lib/resolve-query';
import { isSlurBlockedFor, antiSlurMessage } from '../lib/slur-filter';
import type { Command } from './types';

const MAX_QUEUED_PER_USER = 2;
const LEAVE_GRACE_MS = 60_000;

function isNoResultError(error: unknown): boolean {
  return error instanceof Error && ('code' in error ? error.code === 'ERR_NO_RESULT' : false);
}

function removeBlockedTrack(queue: GuildQueue | null, track: Track): void {
  if (!queue) return;
  if (queue.currentTrack?.id === track.id) {
    queue.node.skip();
  } else {
    queue.removeTrack(track);
  }
}

function queuedByUser(queue: GuildQueue | null, userId: string): number {
  if (!queue) return 0;
  const current = queue.currentTrack?.requestedBy?.id === userId ? 1 : 0;
  const upcoming = queue.tracks.toArray().filter((track) => track.requestedBy?.id === userId).length;
  return current + upcoming;
}

async function enqueue(
  player: Player,
  voiceChannel: VoiceBasedChannel,
  resolved: ResolvedQuery,
  searchEngine: ResolvedQuery['searchEngine'],
  requestedBy: User,
): Promise<Track> {
  const { track } = await player.play(voiceChannel, resolved.query, {
    searchEngine,
    requestedBy,
    nodeOptions: {
      disableVolume: true,
      leaveOnEmpty: true,
      leaveOnEmptyCooldown: LEAVE_GRACE_MS,
      leaveOnEnd: true,
      leaveOnEndCooldown: LEAVE_GRACE_MS,
    },
  });
  return track;
}

/** Confirms the queued track, unless the resolved name trips the per-user slur filter. */
async function respondQueued(
  interaction: ChatInputCommandInteraction<'cached'>,
  track: Track,
): Promise<void> {
  if (isSlurBlockedFor(interaction.user.id, `${track.title} ${track.author}`)) {
    removeBlockedTrack(useQueue(interaction.guildId), track);
    return replyEphemeral(interaction, antiSlurMessage());
  }
  return replyEphemeral(interaction, `Queued: ${track.title} (${track.duration})`);
}

export const play: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play from link or search')
    .addStringOption((option) =>
      option.setName('query').setDescription('Link or search text').setRequired(true),
    ),

  async execute(interaction) {
    await deferEphemeral(interaction);

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return replyEphemeral(interaction, MSG.noVoice);
    }

    const me = interaction.guild.members.me;
    const permissions = me && voiceChannel.permissionsFor(me);
    if (!permissions?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
      return replyEphemeral(interaction, MSG.noPermission);
    }

    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!isAdmin && queuedByUser(useQueue(interaction.guildId), interaction.user.id) >= MAX_QUEUED_PER_USER) {
      return replyEphemeral(interaction, MSG.queueLimit);
    }

    const query = interaction.options.getString('query', true);
    if (isSlurBlockedFor(interaction.user.id, query)) {
      return replyEphemeral(interaction, antiSlurMessage());
    }

    const player = useMainPlayer();
    const resolved = resolvePlayQuery(query);

    try {
      const track = await enqueue(
        player,
        voiceChannel,
        resolved,
        resolved.searchEngine,
        interaction.user,
      );
      return respondQueued(interaction, track);
    } catch (error) {
      if (!resolved.fallbackEngine || !isNoResultError(error)) {
        if (isNoResultError(error)) {
          return replyEphemeral(interaction, MSG.noResults);
        }
        throw error;
      }
    }

    try {
      const track = await enqueue(
        player,
        voiceChannel,
        resolved,
        resolved.fallbackEngine!,
        interaction.user,
      );
      return respondQueued(interaction, track);
    } catch (error) {
      if (isNoResultError(error)) {
        return replyEphemeral(interaction, MSG.noResults);
      }
      throw error;
    }
  },
};
