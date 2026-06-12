import { SlashCommandBuilder } from 'discord.js';

import { replyEphemeral } from '../lib/ephemeral';
import type { Command } from './types';

const HELP_TEXT = `\
**Music Bot Commands**

\`/play\` \`<song name or link>\` — add a song to the queue
\`/skip\` \`[song]\` — skip the current track (or remove a queued one)
\`/stop\` — stop playback and clear the queue
\`/queue\` — show what's playing and what's up next
\`/voteskip\` \`[song]\` — start a vote to skip (50% of VC needed)
\`/votestop\` — start a vote to stop entirely
\`/loop\` \`<song | queue | off>\` \`[times]\` — loop current song or queue (admin)

**Notes**
— All replies are only visible to you.
— Non-admins can queue up to 2 songs at a time.
— The bot follows you if you move to another channel while your song is playing.
— If you can't \`/skip\`, use \`/voteskip\` instead.`;

export const help: Command = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show bot commands'),

  async execute(interaction) {
    return replyEphemeral(interaction, HELP_TEXT);
  },
};
