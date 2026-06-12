import type { GuildQueue, Track } from 'discord-player';

/** Autocomplete value meaning "the currently playing track". */
export const CURRENT_TRACK = 'current';

const MAX_CHOICES = 25;
const MAX_CHOICE_NAME = 100;

export type TrackChoice = { name: string; value: string };

function trimName(name: string): string {
  return name.length > MAX_CHOICE_NAME ? `${name.slice(0, MAX_CHOICE_NAME - 1)}…` : name;
}

export function trackChoices(queue: GuildQueue, canPick: (track: Track) => boolean): TrackChoice[] {
  const choices: TrackChoice[] = [];

  const current = queue.currentTrack;
  if (current && canPick(current)) {
    choices.push({ name: trimName(`> ${current.title}`), value: CURRENT_TRACK });
  }

  queue.tracks.toArray().forEach((track, index) => {
    if (!canPick(track)) return;
    choices.push({ name: trimName(`${index + 1}. ${track.title}`), value: track.id });
  });

  return choices.slice(0, MAX_CHOICES);
}

export function filterChoices(choices: TrackChoice[], search: string): TrackChoice[] {
  const lowered = search.toLowerCase();
  return choices.filter((choice) => choice.name.toLowerCase().includes(lowered));
}
