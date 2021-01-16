import { Command } from 'discord.js-commando';
import i18n from 'i18n';

import VoiceParser from 'config/VoiceParser/';
import APIHandler from 'config/APIHandler';

import { args, aliases } from 'meta/quotes/add';

export default class Quote extends Command {
  constructor(client) {
    super(client, {
      name: 'add',
      group: 'quotes',
      memberName: 'add',
      description: 'Adds a quote',
      ownerOnly: false,
      args,
      aliases,
    });
  }

  async run(message, { quote, author, voiceId }) {
    const time = { start: Date.now() };
    const {
      author: { username: contributor },
      guild: { id, name },
    } = message;

    const reply = await message.reply(i18n.translate('Your quote will be added.'));
    const parser = new VoiceParser({
      overrides: await this.client.provider.get(id, 'overrides', { voice: {}, text: [] }),
    });

    const newQuote = {
      ...(await parser.run({ quote, author, voiceId })),
      contributor,
      timestamp: new Date().getTime(),
      embed: null,
    };

    const { errors } = await APIHandler.setQuotes({
      newQuote,
      id,
      name: name.toLowerCase().replace(/[ ]/g, '_'),
      action: 'add',
    });

    if (errors === null) {
      const quotes = await this.client.provider.get(id, 'quotes', []);
      await this.client.provider.set(id, 'quotes', [...quotes, newQuote]);
    }

    time.end = Date.now();

    const update =
      errors === null
        ? `${i18n.translate('Your quote has been added.')} (${time.end - time.start}ms)`
        : i18n.translate('You quote was not added due to an error.');

    return reply.edit(update);
  }
}
