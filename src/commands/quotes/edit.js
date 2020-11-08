import { Command } from 'discord.js-commando';

import i18n from 'i18n';

import APIHandler from 'config/APIHandler';
import VoiceParser from 'config/VoiceParser';
import { args } from 'meta/quotes/edit';

const audioUpdateRequired = (field) => ['quote', 'author', 'voice'].includes(field);

export default class Edit extends Command {
  constructor(client) {
    super(client, {
      name: 'edit',
      group: 'quotes',
      memberName: 'edit',
      description: 'Edit a quote and update its audio.',
      ownerOnly: false,
      args,
    });
  }

  async run(message, { field, index, newContent, voiceId }) {
    const {
      guild: { id, name },
    } = message;
    const quotes = await this.client.provider.get(id, 'quotes', []);
    const quoteToUpdate = quotes[index];

    const reply = await message.say(
      `Updating ${field} #${index}: (${JSON.stringify({ field, index, newContent, voiceId })})`,
    );

    if (quoteToUpdate) {
      let newQuote = { ...quoteToUpdate, [field]: newContent };

      if (audioUpdateRequired(field)) {
        newQuote = await VoiceParser.parse(newQuote);
      }

      const { errors } = await APIHandler.setQuotes({
        newQuote,
        id,
        name: name.toLowerCase().replace(/[ ]/g, '_'),
        action: 'edit',
        index,
      });

      if (errors === null) {
        const newQuotes = [...quotes];
        newQuotes[index] = newQuote;
        await this.client.provider.set(id, 'quotes', newQuotes);
      }
    }

    return reply.edit(i18n.translate('Sucesfully updated {{field}} #{{index}}', { field, index }));
  }
}
