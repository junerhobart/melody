import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

export type Command = {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction<'cached'>) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction<'cached'>) => Promise<void>;
};
