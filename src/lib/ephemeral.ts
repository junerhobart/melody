import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';

export const MSG = {
  noVoice: 'Not in voice channel.',
  noPermission: 'Missing voice permissions.',
  noResults: 'No results.',
  queueEmpty: 'Queue empty.',
  playbackStopped: 'Playback stopped.',
  commandFailed: 'Command failed.',
  notYourTrackSkip: 'Not your track. Use /voteskip.',
  notYourTrackStop: 'Not your track. Use /votestop.',
  joinBotVoice: 'Join the voice channel first.',
  pollRunning: 'Poll already running.',
  pollCreated: 'Poll created.',
  pollFailed: 'Could not create poll here.',
  adminOnly: 'Admin only.',
  queueLimit: 'Limit: 2 songs in queue per user.',
} as const;

/** Defers ephemeral — Discord shows the cycling "thinking" indicator until editReply. */
export async function deferEphemeral(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
}

export async function replyEphemeral(
  interaction: ChatInputCommandInteraction,
  content: string,
): Promise<void> {
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content });
  } else {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  }
}
