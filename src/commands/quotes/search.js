import { Command } from 'discord.js-commando';

import i18n from 'i18n';

import Voice from 'modules/voice';
import { args, aliases, examples } from 'meta/quotes/search';

const parseDate = (ts) => {
  const dateString = new Intl.DateTimeFormat('en-GB').format(new Date(ts));
  const dateArray = dateString.split('/');

  // TODO: Major hacky snappy fix
  const d = dateArray.map((n) => `0${n}`.slice(-2));
  return `${d[1]}-${d[0]}-${d[2]}`;
};

const parseQuote = ({ timestamp, audio, contributor, quote, author, embed }, index) => ({
  parsedQuote: `#${index} - ${contributor} (${parseDate(timestamp)})\n\n*"${quote}"*\n-${author}`,
  audio,
  embed,
});

const playAudioQuote = async (data, preload) => {
  Voice.say(data, preload);
};

export default class Quote extends Command {
  constructor(client) {
    super(client, {
      name: 'search',
      group: 'quotes',
      memberName: 'search',
      description: 'Allows searching of a specific quote',
      args,
      examples,
      aliases,
    });
  }

  async run(message, { field, query }) {
    const { guild, author } = message;
    const quotes = await this.client.provider.get(guild, 'quotes', []);
    const matches = quotes.filter((quote) => {
      const { [field]: f } = quote;
      if (field === 'all') {
        return Object.values(quote).some(
          (value) => value !== null && value.toString().toLowerCase().includes(query.toLowerCase())
        );
      }
      return f.toLowerCase().includes(query.toLowerCase());
    });

    const i = Math.floor(Math.random() * matches.length);
    const originalIndex = quotes.findIndex((obj) => JSON.stringify(obj) === JSON.stringify(matches[i]));

    if (matches[i]) {
      const { parsedQuote } = parseQuote(matches[i], originalIndex);

      playAudioQuote({ ...matches[i], guild, member: author }, false);

      return message.say(parsedQuote);
    }
    return message.say(i18n.translate('No results found.'));
  }
}
