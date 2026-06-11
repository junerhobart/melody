import { REST, Routes } from 'discord.js';

import { commands } from './commands';
import { config } from './config';

const rest = new REST().setToken(config.discordToken);
const body = [...commands.values()].map((command) => command.data.toJSON());

await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });
console.log(`Registered ${body.length} guild commands: ${[...commands.keys()].join(', ')}`);
