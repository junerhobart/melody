import { useQueue } from 'discord-player';
import { PermissionFlagsBits, type VoiceState } from 'discord.js';

/** Move the bot when the current track's requester switches to another voice channel. */
export async function followRequester(oldState: VoiceState, newState: VoiceState): Promise<void> {
  const member = newState.member;
  if (!member || member.user.bot) return;
  if (!oldState.channelId || !newState.channelId) return;
  if (oldState.channelId === newState.channelId) return;

  const queue = useQueue(newState.guild.id);
  if (!queue?.channel || !queue.isPlaying()) return;
  if (oldState.channelId !== queue.channel.id) return;
  if (queue.currentTrack?.requestedBy?.id !== member.id) return;

  const me = newState.guild.members.me;
  const target = newState.channel;
  if (!me || !target) return;

  const permissions = target.permissionsFor(me);
  if (!permissions?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) return;

  await me.voice.setChannel(target);
  console.log(`[follow] moved to ${target.name} after ${member.user.tag}`);
}
