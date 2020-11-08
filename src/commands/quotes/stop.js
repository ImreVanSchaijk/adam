import { Command } from 'discord.js-commando';
import i18n from 'i18n';

export default class Stop extends Command {
  constructor(client) {
    super(client, {
      name: 'stop',
      group: 'quotes',
      memberName: 'stop',
      description: 'Stop all that shit.',
    });
  }

  run(msg) {
    msg.delete({ timeout: 2000, reason: i18n.translate('Auto-removed command message') });

    if (this.client.voice.connections.has(msg.guild.id)) {
      const con = this.client.voice.connections.get(msg.guild.id);
      con.disconnect();
    }
  }
}
