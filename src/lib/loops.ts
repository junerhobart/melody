import { QueueRepeatMode, type GuildQueue, type Track } from 'discord-player';

export type LoopMode = 'song' | 'queue' | 'off';

/**
 * remaining = extra plays left before loop turns itself off (Infinity = forever).
 * markerTrackId marks the end of a queue cycle: each time that track finishes,
 * one full queue loop is done.
 */
type LoopState = { remaining: number; markerTrackId?: string };

const states = new Map<string, LoopState>();

export function setLoop(queue: GuildQueue, mode: LoopMode, times?: number): void {
  const guildId = queue.guild.id;

  if (mode === 'off') {
    queue.setRepeatMode(QueueRepeatMode.OFF);
    states.delete(guildId);
    return;
  }

  const remaining = times ?? Infinity;
  if (mode === 'song') {
    queue.setRepeatMode(QueueRepeatMode.TRACK);
    states.set(guildId, { remaining });
    return;
  }

  queue.setRepeatMode(QueueRepeatMode.QUEUE);
  const lastUpcoming = queue.tracks.at(queue.tracks.size - 1);
  const marker = lastUpcoming ?? queue.currentTrack;
  states.set(guildId, { remaining, markerTrackId: marker?.id });
}

export function clearLoop(guildId: string): void {
  states.delete(guildId);
}

/** Call on playerFinish: counts down finite loops and disables repeat when done. */
export function handleLoopFinish(queue: GuildQueue, track: Track): void {
  const state = states.get(queue.guild.id);
  if (!state || state.remaining === Infinity) return;

  if (queue.repeatMode === QueueRepeatMode.TRACK) {
    state.remaining -= 1;
  } else if (queue.repeatMode === QueueRepeatMode.QUEUE) {
    if (track.id !== state.markerTrackId) return;
    state.remaining -= 1;
  } else {
    states.delete(queue.guild.id);
    return;
  }

  if (state.remaining <= 0) {
    queue.setRepeatMode(QueueRepeatMode.OFF);
    states.delete(queue.guild.id);
  }
}
