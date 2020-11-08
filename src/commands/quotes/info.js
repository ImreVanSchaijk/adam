import { Command } from 'discord.js-commando';

import { args, examples } from 'meta/quotes/info';

export default class Info extends Command {
  constructor(client) {
    super(client, {
      name: 'info',
      group: 'quotes',
      memberName: 'info',
      description: 'Show quote info.',
      args,
      examples,
    });
  }

  async run(message, { index }) {
    const {
      guild: { id },
    } = message;
    const quotes = await this.client.provider.get(id, 'quotes', []);

    const quoteString = `\`\`\`json\n${JSON.stringify(quotes[index], null, 2)}\n\`\`\``;

    return message.say(quoteString);
  }
}
