import { Command } from 'discord.js-commando';

import i18n from 'i18n';

import { args, oneOf, examples } from 'meta/quotes/override';

export default class Override extends Command {
  constructor(client) {
    super(client, {
      name: 'override',
      group: 'quotes',
      memberName: 'override',
      description: 'Automatically override quote text or audio.',
      args,
      examples,
    });
  }

  async run(message, args) {
    console.log({ args });
    const { type, voice, pattern, output } = args;
    const {
      guild: { id },
    } = message;

    const overrides = await this.client.provider.get(id, 'overrides', {
      voice: {
        jeroensad22k: [
          ['a', 'b'],
          ['c', 'd'],
        ],
      },
      text: [],
    });

    const used = overrides[type];

    if (type === 'clear') {
      await this.client.provider.set(id, 'overrides', { voice: {}, text: [] });
    }

    if (type === 'list') {
      return message.say(`\`\`\`json\n${JSON.stringify(overrides)}\`\`\``);
    }

    if (type === 'voice') {
      const hasCollision = used[voice] && used[voice].map(([element]) => element).includes(pattern);
      if (hasCollision) {
        return message.say(
          i18n.translate('The pattern `{{pattern}}` already exists for voice `{{voice}}`', { pattern, voice })
        );
      }

      console.log({ used });
      if (!used[voice]) used[voice] = {};

      console.log({ overrides, u: used[voice] });

      const newValue = [...used[voice], [pattern, output]];
      const newOverrides = { ...overrides };
      Object.assign(newOverrides.voice[voice], newValue);

      this.client.provider.set(id, 'overrides', newOverrides);
    }

    return message.say(`\`\`\`json\n${JSON.stringify(args)}\`\`\``);
  }
}
