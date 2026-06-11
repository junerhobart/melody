import type { GuildQueue } from 'discord-player';
import type { Message, SendableChannels } from 'discord.js';

export type PollKind = 'skip' | 'stop';

type ActivePoll = { guildId: string; kind: PollKind; message: Message };

const POLL_QUESTION_MAX = 300;
const pollsByGuildKind = new Map<string, ActivePoll>();
const pollsByMessage = new Map<string, ActivePoll>();

const pollKey = (guildId: string, kind: PollKind) => `${guildId}:${kind}`;

export function hasPoll(guildId: string, kind: PollKind): boolean {
  return pollsByGuildKind.has(pollKey(guildId, kind));
}

export function findPollByMessage(messageId: string): ActivePoll | undefined {
  return pollsByMessage.get(messageId);
}

export async function createPoll(
  channel: SendableChannels,
  guildId: string,
  kind: PollKind,
  question: string,
): Promise<void> {
  const message = await channel.send({
    poll: {
      question: { text: question.slice(0, POLL_QUESTION_MAX) },
      answers: [{ text: kind === 'skip' ? 'Skip' : 'Stop' }],
      duration: 1,
      allowMultiselect: false,
    },
  });

  const poll: ActivePoll = { guildId, kind, message };
  pollsByGuildKind.set(pollKey(guildId, kind), poll);
  pollsByMessage.set(message.id, poll);
}

/** Deletes the poll message and forgets it. Safe to call when no poll exists. */
export function endPoll(guildId: string, kind: PollKind): void {
  const poll = pollsByGuildKind.get(pollKey(guildId, kind));
  if (!poll) return;
  pollsByGuildKind.delete(pollKey(guildId, kind));
  pollsByMessage.delete(poll.message.id);
  poll.message.delete().catch(() => {});
}

export function endAllPolls(guildId: string): void {
  endPoll(guildId, 'skip');
  endPoll(guildId, 'stop');
}

/** Votes needed to pass: >=50% of non-bot members in the bot's voice channel. */
export function votesNeeded(queue: GuildQueue): number {
  const listeners = queue.channel?.members.filter((member) => !member.user.bot).size ?? 0;
  return Math.max(1, Math.ceil(listeners / 2));
}
