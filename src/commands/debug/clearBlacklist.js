import { Command } from 'discord.js-commando';

import { args, examples } from 'meta/quotes/info';

export default class ClearBlacklist extends Command {
  constructor(client) {
    super(client, {
      name: 'clearblacklist',
      group: 'debug',
      memberName: 'clearblacklist',
      description: "Clears the server's quote blacklist.",
      args,
      examples,
    });
  }

  async run(message) {
    const { guild } = message;

    await this.client.provider.set(guild, 'blacklist', ['0']);

    return message.say('Blacklist cleared');
  }
}
