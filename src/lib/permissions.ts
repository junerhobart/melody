import type { GuildQueue } from 'discord-player';
import { PermissionFlagsBits, type GuildMember } from 'discord.js';

/** Admins always can; otherwise only whoever requested the current track. */
export function canControlPlayback(queue: GuildQueue, member: GuildMember): boolean {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  return queue.currentTrack?.requestedBy?.id === member.id;
}

export function isInBotVoiceChannel(queue: GuildQueue, member: GuildMember): boolean {
  return queue.channel !== null && member.voice.channelId === queue.channel.id;
}
