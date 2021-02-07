import { Collection } from 'discord.js';

import fs from 'promise-fs';
import path from 'path';

import APIHandler from 'config/APIHandler';
import Voice from 'modules/voice';

const getFolders = async (folders) => {
  const allFolders = {};

  const folderPromises = await Promise.all(
    folders.map((folder) => fs.readdir(path.resolve(__dirname, `../audio/${folder}`)))
  );

  folders.forEach((folder, i) => {
    allFolders[folder] = folderPromises[i];
  });

  return allFolders;
};

const downloadQuotes = async (guilds, provider) => {
  const ids = [...guilds.cache.array().map(({ id }) => id)];

  const { quotes } = await APIHandler.getQuotes(ids);

  const addedQuotes = await Promise.all(Object.keys(quotes).map((id) => provider.set(id, 'quotes', quotes[id])));

  const quoteCollection = new Collection();
  addedQuotes.forEach((q, i) => {
    quoteCollection.set(ids[i], q);
  });

  return quoteCollection;
};

const checkFolders = async () => {
  const directory = await fs.readdir(path.resolve(__dirname, '../../', 'src'));

  if (!directory.includes('audio')) {
    await fs.mkdir(path.resolve(__dirname, '../src/audio'));
  }
};

const preloadQuotes = async ({ quotes, provider }) => {
  const getNumbers = quotes.keyArray().map(async (key) => {
    const blacklist = await provider.get(key, 'blacklist', ['0']);
    const validQuotes = Object.keys(quotes.get(key)).filter((value) => !blacklist.includes(value));

    const nextRandom = validQuotes.length > 0 ? validQuotes[Math.floor(Math.random() * validQuotes.length)] : 0;
    await provider.set(key, 'blacklist', [...blacklist, `${validQuotes[nextRandom]}`]);
    await provider.set(key, 'nextRandom', nextRandom);

    return nextRandom;
  });

  const existingFiles = await getFolders(['quotes', 'soundbytes']);

  await Promise.all(
    Object.keys(existingFiles).map(async (key) => {
      existingFiles[key].forEach((file) => fs.unlink(path.resolve(__dirname, `../audio/${key}/${file}`)));
    })
  );

  const selectedNumbers = await Promise.all(getNumbers);
  const getFiles = selectedNumbers.map(async (number, i) => {
    const id = quotes.keyArray()[i];
    const { file } = await Voice.preloadFile({ ...quotes.get(id)[number], id }, provider);

    return file;
  });

  await Promise.all(getFiles);
  console.info('Finished preloading audio');
};

const ready = async ({ guilds, provider }) => {
  const quotes = await downloadQuotes(guilds, provider);
  await checkFolders();
  await preloadQuotes({ quotes, provider });
};

export default ready;
