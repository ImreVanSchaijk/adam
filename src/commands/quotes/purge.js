import { Command } from 'discord.js-commando';

import i18n from 'i18n';

import APIHandler from 'config/APIHandler';
import { args } from 'meta/quotes/purge';

export default class Purge extends Command {
  constructor(client) {
    super(client, {
      name: 'purge',
      group: 'quotes',
      memberName: 'purge',
      description: 'Purges the selected quote',
      ownerOnly: true,
      args,
    });
  }

  async run(message, { index }) {
    const {
      guild: { id, name },
    } = message;

    if (index) {
      const { errors } = await APIHandler.setQuotes({
        id,
        name: name.toLowerCase().replace(/[ ]/g, '_'),
        action: 'purge',
        index,
      });

      if (errors === null) {
        const quotes = await this.client.provider.get(id, 'quotes', []);
        quotes[index] = null;
        const newQuotes = [...quotes.filter((quote) => quote !== null)];

        await this.client.provider.set(id, 'quotes', newQuotes);
      } else {
        return message.say(i18n.translate('An error occured while purging quote #{{index}}.'), { index });
      }
    }
    return message.say(i18n.translate('Quote #{{index}} was purged.', { index }));
  }
}
