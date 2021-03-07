import { Command } from 'discord.js-commando';

import Voice from 'modules/voice';
import { args } from 'meta/quotes/quote';

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

export default class Quote extends Command {
  constructor(client) {
    super(client, {
      name: 'quote',
      group: 'quotes',
      memberName: 'quote',
      description: 'Call a quote from memory',
      ownerOnly: false,
      args,
    });
  }

  async setNextRandom(guild, quotes) {
    const { provider } = this.client;
    const blacklist = await provider.get(guild, 'blacklist', ['0']);
    let validIndices = Object.keys(quotes).filter((key) => !blacklist.includes(key));

    const randomIndex = await provider.get(guild, 'nextRandom', '0');

    if (validIndices.length === 1) {
      validIndices = Object.keys(quotes);
      await provider.set(guild, 'blacklist', ['0']);
    } else {
      await provider.set(guild, 'blacklist', [...blacklist, `${validIndices[randomIndex]}`]);
    }

    // Set index of next quote and preload its audio
    const nextRandom = validIndices[Math.floor(Math.random() * (validIndices.length || Object.keys(quotes).length))];
    provider.set(guild, 'nextRandom', nextRandom);
    new Voice({ id: guild.id, provider, quote: quotes[nextRandom] }).preloadFile();
  }

  async run(message, { index }) {
    const { provider } = this.client;
    const { guild } = message;

    const quotes = await provider.get(guild, 'quotes', []);
    const quoteIndex = index.length > 0 ? index : await provider.get(guild, 'nextRandom', '0');
    const { parsedQuote } = parseQuote(quotes[quoteIndex], quoteIndex);

    message.say(parsedQuote);

    if (index.length === 0) this.setNextRandom(guild, quotes);
    new Voice({ message, provider, quote: quotes[quoteIndex] }).say();

    return null;
  }
}
