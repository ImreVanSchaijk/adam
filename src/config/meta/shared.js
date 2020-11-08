import i18n from 'i18n';

const indexFunctions = {
  validate: async (value, { client, guild }) => {
    const quotes = await client.provider.get(guild, 'quotes', []);
    const last = Object.keys(quotes).length;
    const total = last - 1;

    if (!Number.isNaN(+value) && value !== 'last') {
      if (+value >= 0 && +value < last) return true;

      if (+value < 0) return i18n.translate(`An index of {{value}}?! A negative index? I don't even.`, { value });

      if (+value > total) return i18n.translate(`There are only {{value}} quotes on this server.`, { value: total });
    }

    if (value === 'last') return true;

    return `The index '${value}' is not a valid number. Try a number between 0 and ${total}. You can also use 'last' for the most recent quote.`;
  },
  parse: async (value, { client, guild }) => {
    if (value === 'last') {
      const quotes = await client.provider.get(guild, 'quotes', []);
      return (Object.keys(quotes).length - 1).toString();
    }
    return value;
  },
};

const oneOf = ['quote', 'author', 'contributor', 'embed', 'audio', 'voice'];

const fieldFunctions = {
  oneOf,
  parse: (value) => (value === 'voice' ? 'voiceId' : value),
};

export { indexFunctions, fieldFunctions };
