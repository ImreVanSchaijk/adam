import { Command } from 'discord.js-commando';

import i18n from 'i18n';
import fetch from 'node-fetch';
import fs from 'promise-fs';
import path from 'path';

import Voice from 'modules/voice';

import { api } from 'settings';

const extractPattern = ([pattern]) =>
  pattern
    ? pattern
        .toString()
        .match(/\(.*?\)/g)
        .pop()
        .replace(/[()]/g, '')
        .split('|')
    : [];

export default class SoundByte extends Command {
  constructor(client) {
    super(client, {
      name: 'soundbyte',
      group: 'custom',
      memberName: 'soundbyte',
      description: 'soundbyte all that shit.',
    });

    this.setPattern();
  }

  async setPattern() {
    const response = await fetch(`${api.quotes}/getSoundbytes.php`);
    const files = await response.json();
    const oldPattern = extractPattern(this.patterns || []);

    this.patterns = [
      new RegExp(`^!(soundbyte|${files.map((file) => file && file.replace(/(\.mp3)/g, '')).join('|')})`),
    ];

    const newPattern = extractPattern(this.patterns || []);
    return newPattern.filter((pattern) => !oldPattern.includes(pattern));
  }

  async run(message) {
    const { content } = message;

    const file = content.replace('!', '');
    if (file !== 'soundbyte') {
      const response = new Voice({
        folderType: 'soundbytes',
        message,
        quote: { audio: `${api.audio}/bytes/${file}.mp3` },
      }).say();

      if (typeof response === 'string') {
        return message.say(response);
      }
      return null;
    }

    const updates = await message.say(i18n.translate('Looking for soundbyte updates'));
    const addedPatterns = await this.setPattern();

    return updates.edit(
      i18n.translate('Soundbyte lookup complete. Added {{addedPatterns}}.', {
        addedPatterns: addedPatterns.length > 0 ? addedPatterns.join(', ') : 'no new patterns',
      })
    );
  }
}
