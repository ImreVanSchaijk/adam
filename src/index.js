import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { Client, SQLiteProvider } from 'discord.js-commando';

import colors from 'colors';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import commandGroups from 'commands';
import allEvents from 'events';
import { discord } from 'settings';

import 'translate';

const { token, debugToken, owner } = discord;

const isDebug = process.argv.includes('--debug-discord');
const loginToken = isDebug ? debugToken : token;
const { ready, ...events } = allEvents;

if (isDebug) {
  console.info(colors.red('Using debug token'));
} else process.env.NODE_ENV = 'production';

(async () => {
  const client = new Client({ owner });
  const database = await open({
    filename: path.resolve(__dirname, '../settings.sqlite3'),
    driver: sqlite3.Database,
  });

  Object.keys(events).forEach((key) => {
    client.on(key, events[key]);
  });

  client.login(loginToken);

  client.on('ready', async () => {
    await client.setProvider(new SQLiteProvider(database));

    await ready({ guilds: client.guilds, provider: client.provider });

    client.registry
      .registerGroups(commandGroups)
      .registerDefaults()
      .registerCommandsIn(path.resolve(__dirname, 'commands'));
  });
})();
