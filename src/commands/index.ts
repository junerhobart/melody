import { loop } from './loop';
import { play } from './play';
import { queue } from './queue';
import { skip } from './skip';
import { stop } from './stop';
import type { Command } from './types';
import { voteskip } from './voteskip';
import { votestop } from './votestop';

export const commands = new Map<string, Command>(
  [play, skip, stop, queue, loop, voteskip, votestop].map((command) => [command.data.name, command]),
);
