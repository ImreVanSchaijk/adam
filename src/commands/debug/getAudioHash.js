import { Command } from 'discord.js-commando';
import { MessageAttachment, MessageEmbed } from 'discord.js';

import i18n from 'i18n';

import { args, examples } from 'meta/debug/getAudioHash';

import VoiceParser from 'config/VoiceParser';

export default class GetAudioHash extends Command {
  constructor(client) {
    super(client, {
      name: 'getaudiohash',
      group: 'debug',
      memberName: 'getaudiohash',
      description: 'Gets the hash of the parsed audio output object.',
      args,
      examples,
    });
  }

  async run(message, { index }) {
    const { provider } = this.client;
    const {
      guild: { id },
    } = message;

    const output = {};

    const quotes = await provider.get(id, 'quotes', []);
    const overrides = await provider.get(id, 'overrides', { voice: {}, text: [] });

    const reply = await message.say(i18n.translate('Fetching hashes'));

    if (index === 'list') {
      const parser = new VoiceParser({ overrides });
      const hashes = await Promise.all(
        quotes.map(async (quote) => {
          const { hash } = await parser.getAudioHash(quote);
          return hash;
        })
      );

      const embed = new MessageAttachment(Buffer.from(JSON.stringify(hashes, null, 2)), 'hashlist.json');
      return reply.channel.send(embed);
    }

    const { hash, ...rest } = await new VoiceParser({ overrides }).getAudioHash(quotes[index]);

    output[`hashed: ${hash}`] = rest;
    output.raw = quotes[index];

    const quoteString = `\`\`\`json\n${JSON.stringify(output, null, 2)}\n\`\`\``;

    return message.say(quoteString);
  }
}
