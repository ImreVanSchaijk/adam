import { Command } from 'discord.js-commando';
import i18n from 'i18n';

import { args } from 'meta/quotes/voices';
import voices from 'config/voices.json';

export default class Voices extends Command {
  constructor(client) {
    super(client, {
      name: 'voices',
      group: 'quotes',
      memberName: 'voices',
      description: 'Show available voices',
      ownerOnly: false,
      args,
    });
  }

  async run(message, { language }) {
    const [first, ...rest] = language;
    const cleanRest = rest.join('').replace(/_([(]?[a-zA-Z])/g, (a, value) => ` ${value.toUpperCase()}`);
    const cleanLanguage = `${first.toUpperCase()}${cleanRest}`;

    const reply = i18n.translate('The following voices are available in {{language}}:\n\n>>> {{voiceList}}', {
      language: cleanLanguage,
      voiceList: voices[language.toLowerCase()].join('\n'),
    });

    return message.say(reply);
  }
}
