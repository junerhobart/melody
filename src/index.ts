import { useQueue } from 'discord-player';
import 'dotenv/config';

import { readFileSync } from 'node:fs';

import { Client, Events, GatewayIntentBits, Partials } from 'discord.js';

import { commands } from './commands';
import { config } from './config';
import { MSG, replyEphemeral } from './lib/ephemeral';
import { shouldUseYoutubeDl } from './lib/ffmpeg';
import { followRequester } from './lib/follow';
import { createPlayer } from './lib/player';
import { endPoll, findPollByMessage, votesNeeded } from './lib/polls';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  version: string;
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessagePolls,
  ],
  partials: [Partials.Message],
});

await createPlayer(client);

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log(`[bot] v${version} | stream: ${shouldUseYoutubeDl() ? 'yt-dlp' : 'innertube'}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete() && interaction.inCachedGuild()) {
    try {
      await commands.get(interaction.commandName)?.autocomplete?.(interaction);
    } catch (error) {
      console.error(`Autocomplete /${interaction.commandName} failed:`, error);
    }
    return;
  }

  if (!interaction.isChatInputCommand() || !interaction.inGuild()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    if (!interaction.inCachedGuild()) {
      await interaction.guild!.members.fetch(interaction.user.id);
    }
    if (!interaction.inCachedGuild()) {
      console.error(`[interaction] uncached for /${interaction.commandName}`);
      await replyEphemeral(interaction, MSG.commandFailed);
      return;
    }

    await command.execute(interaction);
  } catch (error) {
    console.error(`Command /${interaction.commandName} failed:`, error);
    await replyEphemeral(interaction, MSG.commandFailed).catch(() => {});
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  try {
    await followRequester(oldState, newState);
  } catch (error) {
    console.error('[follow] failed:', error);
  }
});

client.on(Events.MessagePollVoteAdd, async (answer) => {
  try {
    const poll = findPollByMessage(answer.poll.message.id);
    if (!poll) return;

    const queue = useQueue(poll.guildId);
    if (!queue?.channel) {
      return endPoll(poll.guildId, poll.kind);
    }

    const listeners = queue.channel.members.filter((member) => !member.user.bot);
    const voters = await answer.fetchVoters();
    const validVotes = voters.filter((user) => listeners.has(user.id)).size;

    if (validVotes < votesNeeded(queue)) return;

    if (poll.kind === 'stop') {
      queue.delete();
    } else if (!poll.trackId) {
      queue.node.skip();
    } else {
      const track = queue.tracks.toArray().find((queued) => queued.id === poll.trackId);
      if (track) {
        queue.removeTrack(track);
      } else if (queue.currentTrack?.id === poll.trackId) {
        queue.node.skip();
      }
    }
    endPoll(poll.guildId, poll.kind);
  } catch (error) {
    console.error('[poll] vote handling failed:', error);
  }
});

await client.login(config.discordToken);
