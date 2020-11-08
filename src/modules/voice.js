import btoa from 'btoa';
import fetch from 'node-fetch';
import fs from 'promise-fs';
import path from 'path';

import { fileURL } from 'settings';

const getFileName = (audio, encode) => {
  const [name] = [
    audio.startsWith('http') ? /^https?.*\/(?<name>.*?)\.mp3$/.exec(audio).groups.name : [audio],
  ].flat();
  return encode ? btoa(name) : name;
};

const Voice = {
  parseAudio: (audio) => (audio.startsWith('http') ? audio : `${fileURL}${audio}.mp3`),

  preloadFile: async ({ audio, ext, folderType, encode }) => {
    const audioToPlay = Voice.parseAudio(audio);

    const response = await fetch(audioToPlay);
    const file = await response.arrayBuffer();

    const fileName = path.resolve(
      __dirname,
      `../audio/${folderType}/${getFileName(audio, encode)}.${ext}`,
    );

    if (!fs.existsSync(fileName)) {
      await fs.writeFile(fileName, Buffer.from(file), 'binary');
    }

    return { file: fileName, error: null };
  },

  say: async (
    { guild, member, audio, folderType },
    preload = false,
    preloadData = { type: 'remove', encode: true },
  ) => {
    const { id } = member;
    const { encode } = preloadData;
    const voiceChannels = guild.channels.cache.filter(({ type }) => type === 'voice');

    const playing = voiceChannels.map(async (channel) => {
      const userIsInChannel = channel.members.get(id);

      if (userIsInChannel) {
        let filePath = path.resolve(
          __dirname,
          `../audio/${folderType}/${getFileName(audio, encode)}.mp3`,
        );

        if (!preload) {
          const loadedFile = await Voice.preloadFile({ audio, ext: 'mp3', folderType, encode });

          if (!loadedFile) return;

          const { file, error } = loadedFile;
          if (error === null) {
            filePath = file;
          }
        }

        const connection = await channel.join();
        const dispatcher = await connection.play(fs.createReadStream(filePath));

        const fileRemovalFallback = setTimeout(() => {
          const { type } = preloadData;
          if (type === 'remove') fs.unlink(filePath);
        }, 120000);

        dispatcher.on('speaking', (isSpeaking) => {
          if (isSpeaking === 0) {
            clearTimeout(fileRemovalFallback);

            const { type } = preloadData;
            if (type === 'remove') fs.unlink(filePath);

            connection.disconnect();
          }
        });
        dispatcher.on('error', (e) => {
          console.error(e);

          const { type } = preloadData;
          if (type === 'remove') fs.unlink(filePath);

          connection.disconnect();
        });
      }
    });

    await Promise.all(playing);
  },
};

export default Voice;
