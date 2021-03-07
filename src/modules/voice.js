import fetch from 'node-fetch';
import fs from 'promise-fs';
import path from 'path';
import shortHash from 'short-hash';

import VoiceParser from 'config/VoiceParser';
import APIHandler from 'config/APIHandler';

import { fileURL, sourceURL } from 'settings';

const removeTypes = ['quotes'];
const audioIdentifiers = ['quote', 'author', 'voiceId'];

export default class Voice {
  constructor({ ext = 'mp3', folderType = 'quotes', id = null, message, provider, quote }) {
    this.ext = ext;
    this.folderType = folderType;
    this.id = id || message.guild.id;
    this.message = message;
    this.provider = provider;

    this.quote = {};
    this.audio = quote.audio;
    Object.keys(quote)
      .filter((key) => audioIdentifiers.includes(key))
      .forEach((key) => {
        this.quote[key] = quote[key];
      });

    this.hash = shortHash(JSON.stringify(this.quote));
  }

  async getName() {
    if (this.audio.startsWith('http')) return path.basename(this.audio).replace(/\.mp3/g, '');

    const { hash } = await new VoiceParser({ overrides: await this.getOverrides() }).getAudioHash(this.quote);
    return hash;
  }

  parseAudio({ name }) {
    if (this.audio.startsWith('http')) {
      return this.audio;
    }
    return `${fileURL}/${this.id}/${name}.mp3`;
  }

  async getOverrides() {
    return this.provider.get(this.id, 'overrides', { voice: {}, text: [] });
  }

  async getNewFile(fileName) {
    if (!this.provider) {
      return { file: null, error: new Error('Request failed - unable to reacquire file from source') };
    }

    const parser = new VoiceParser({
      overrides: await this.getOverrides(),
    });

    const { audio: newHash } = await parser.run(this.quote);
    const newFile = await fetch(`${sourceURL}${newHash}.${this.ext}`);

    if (newFile.status === 200 && !fs.existsSync(fileName)) {
      const file = await newFile.arrayBuffer();

      await fs.writeFile(fileName, Buffer.from(file), 'binary');
      await APIHandler.s3Upload({ filePath: fileName, id: this.id, name: `${this.hash}.${this.ext}` });

      return { file: fileName, error: null };
    }
    return { file: null, error: new Error(newFile.statusText) };
  }

  async preloadFile() {
    const name = await this.getName(this.audio);
    const audioToPlay = this.parseAudio({ name });

    const fileName = path.resolve(__dirname, `../audio/${this.folderType}/${name}.${this.ext}`);
    console.log({ fileName, audioToPlay, name });
    const response = await fetch(audioToPlay);

    if (response.status === 200) {
      if (!fs.existsSync(fileName)) {
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(fileName, buffer, 'binary');
      }

      return { file: fileName, error: null };
    }

    // Attempt to reacquire file from source
    if (response.status === 403 && this.folderType === 'quotes') {
      return this.getNewFile(fileName);
    }
    return { file: null, error: new Error(response.statusText) };
  }

  async say() {
    const {
      guild,
      member: { id },
    } = this.message;

    const voiceChannels = guild.channels.cache.filter(({ type }) => type === 'voice');

    const playing = voiceChannels.map(async (channel) => {
      const userIsInChannel = channel.members.get(id);

      if (userIsInChannel) {
        const fileName = await this.getName(this.audio);

        let filePath = path.resolve(__dirname, `../audio/${this.folderType}/${fileName}.mp3`);
        if (!fs.existsSync(filePath)) {
          const loadedFile = await this.preloadFile(this.audio);

          if (!loadedFile) return;
          if (loadedFile.error === null) filePath = loadedFile.file;
        }

        const connection = await channel.join();
        const dispatcher = await connection.play(fs.createReadStream(filePath));

        const fileRemovalFallback = setTimeout(() => {
          if (removeTypes.includes(this.folderType)) fs.unlink(filePath);
        }, 120000);

        dispatcher.on('debug', console.info);

        dispatcher.on('speaking', (isSpeaking) => {
          if (isSpeaking === 0) {
            clearTimeout(fileRemovalFallback);

            if (removeTypes.includes(this.folderType)) fs.unlink(filePath);

            connection.disconnect();
          }
        });
        dispatcher.on('error', (e) => {
          console.error(new Error(e));

          if (removeTypes.includes(this.folderType)) fs.unlink(filePath);

          connection.disconnect();
        });
      }
    });

    await Promise.all(playing);
  }
}
