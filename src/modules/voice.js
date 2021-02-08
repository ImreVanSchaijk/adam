import fetch from 'node-fetch';
import fs from 'promise-fs';
import path from 'path';
import shortHash from 'short-hash';

import VoiceParser from 'config/VoiceParser';
import APIHandler from 'config/APIHandler';

import { fileURL, sourceURL } from 'settings';

const Voice = {
  getName: (audio, { quote, author, voiceId }) => {
    if (audio.startsWith('http')) return path.basename(audio).replace(/\.mp3/g, '');
    return shortHash(JSON.stringify({ quote, author, voiceId }));
  },

  parseAudio: ({ id, audio, name }) =>
    `${audio.startsWith('http') ? audio.replace(/\.mp3$/g, '') : `${fileURL}/${id}/${name}`}.mp3`,

  preloadFile: async ({ audio, id, ext = 'mp3', folderType = 'quotes', ...data }, provider = null) => {
    const name = Voice.getName(audio, data);

    const audioToPlay = Voice.parseAudio({ id, audio, name });

    const fileName = path.resolve(__dirname, `../audio/${folderType}/${name}.${ext}`);
    const response = await fetch(audioToPlay);

    if (response.status === 200) {
      const file = await response.arrayBuffer();

      if (!fs.existsSync(fileName)) {
        await fs.writeFile(fileName, Buffer.from(file), 'binary');
      }

      return { file: fileName, error: null };
    }

    // Attempt to reacquire file from source
    if (response.status === 403 && folderType === 'quotes') {
      if (!provider) return { file: null, error: new Error('Request failed - unable to reacquire file from source') };

      const parser = new VoiceParser({
        overrides: await provider.get(id, 'overrides', { voice: {}, text: [] }),
      });

      const { audio: newHash } = await parser.run(data);
      const newFile = await fetch(`${sourceURL}${newHash}.${ext}`);

      if (newFile.status === 200 && !fs.existsSync(fileName)) {
        const file = await newFile.arrayBuffer();

        await fs.writeFile(fileName, Buffer.from(file), 'binary');
        await APIHandler.s3Upload({ filePath: fileName, id, name: `${name}.${ext}` });

        return { file: fileName, error: null };
      }
    }
    return { file: null, error: new Error(response.statusText) };
  },

  say: async ({ guild, member, audio, folderType = 'quotes', ...data }, preload = false, { type = 'remove' } = {}) => {
    const { id } = member;
    const voiceChannels = guild.channels.cache.filter(({ type: t }) => t === 'voice');

    const playing = voiceChannels.map(async (channel) => {
      const userIsInChannel = channel.members.get(id);

      if (userIsInChannel) {
        const fileName =
          folderType === 'quotes'
            ? shortHash(JSON.stringify({ quote: data.quote, author: data.author, voiceId: data.voiceId }))
            : path.basename(audio).replace(/\.mp3$/, '');

        let filePath = path.resolve(__dirname, `../audio/${folderType}/${fileName}.mp3`);

        if (!preload || !fs.existsSync(filePath)) {
          const loadedFile = await Voice.preloadFile({ audio, id: guild.id, ext: 'mp3', folderType });

          if (!loadedFile) return;

          const { file, error } = loadedFile;
          if (error === null) {
            filePath = file;
          }
        }

        const connection = await channel.join();
        console.log({ now_playing: filePath });
        const dispatcher = await connection.play(fs.createReadStream(filePath));

        const fileRemovalFallback = setTimeout(() => {
          if (type === 'remove') fs.unlink(filePath);
        }, 120000);

        dispatcher.on('debug', console.info);

        dispatcher.on('speaking', (isSpeaking) => {
          if (isSpeaking === 0) {
            clearTimeout(fileRemovalFallback);

            if (type === 'remove') fs.unlink(filePath);

            connection.disconnect();
          }
        });
        dispatcher.on('error', (e) => {
          console.error(new Error(e));

          if (type === 'remove') fs.unlink(filePath);

          connection.disconnect();
        });
      }
    });

    await Promise.all(playing);
  },
};

export default Voice;
