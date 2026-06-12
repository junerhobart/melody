import { useQueue } from 'discord-player';
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { MSG, replyEphemeral } from '../lib/ephemeral';
import { setLoop, type LoopMode } from '../lib/loops';
import type { Command } from './types';

const MAX_LOOP_TIMES = 100;

export const loop: Command = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Loop the current song or queue (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('What to loop')
        .setRequired(true)
        .addChoices(
          { name: 'song', value: 'song' },
          { name: 'queue', value: 'queue' },
          { name: 'off', value: 'off' },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName('times')
        .setDescription('How many times (blank = forever)')
        .setMinValue(1)
        .setMaxValue(MAX_LOOP_TIMES),
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return replyEphemeral(interaction, MSG.adminOnly);
    }

    const queue = useQueue(interaction.guildId);
    if (!queue || !queue.currentTrack) {
      return replyEphemeral(interaction, MSG.queueEmpty);
    }

    const mode = interaction.options.getString('mode', true) as LoopMode;
    const times = interaction.options.getInteger('times') ?? undefined;

    setLoop(queue, mode, times);

    if (mode === 'off') {
      return replyEphemeral(interaction, 'Loop off.');
    }
    const target = mode === 'song' ? 'song' : 'queue';
    const count = times ? `x${times}` : 'forever';
    return replyEphemeral(interaction, `Looping ${target} ${count}.`);
  },
};
