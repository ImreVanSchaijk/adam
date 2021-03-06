import { Command, ArgumentCollector } from 'discord.js-commando';
import i18n from 'i18n';

import allVoices from 'config/voices.json';

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
    const { type, pattern, output, voice, clear } = args;
    const {
      guild: { id },
    } = message;

    const overrides = await this.client.provider.get(id, 'overrides', {
      voice: {},
      text: [],
    });

    const used = overrides[type];

    if (type === 'list') {
      return message.say(`\`\`\`json\n${JSON.stringify(overrides)}\`\`\``);
    }

    if (type === 'voice') {
      if (clear.length > 0) {
        const newOverrides = { ...overrides };
        const [index] = newOverrides.voice[voice]
          .map((override, i) => {
            if (override.includes(pattern)) return i;
            return null;
          })
          .filter((val) => val !== null);

        if (index !== undefined) {
          newOverrides.voice[voice].splice(index, 1);
          this.client.provider.set(id, 'overrides', newOverrides);

          return message.say(
            i18n.translate('Removed {{output}} from override {{pattern}} for {{voice}}', {
              output,
              pattern,
              voice: i18n.translate(voice === 'all' ? 'all voices' : 'voice {{voice}}', { voice }),
            })
          );
        }

        return message.say(i18n.translate('Could not remove pattern {{pattern}}', { pattern }));
      }

      const hasCollision = used[voice] && used[voice].map(([element]) => element).includes(pattern);
      if (hasCollision) {
        const { values } = await new ArgumentCollector(this.client, [
          {
            key: 'answer',
            oneOf: ['yes', 'no'],
            type: 'string',
            prompt: i18n.translate(
              'The pattern `{{pattern}}` already exists for voice `{{voice}}`, do you wish to update this pattern?',
              { pattern, voice }
            ),
          },
        ]).obtain(message);

        if (values.answer !== 'yes') return message.say(i18n.translate('Command cancelled'));
      }

      const newOverrides = { ...overrides };

      if (!used[voice]) used[voice] = [];
      const newValue = [...(!hasCollision ? used[voice] : []), [pattern, output, Date.now()]];
      newOverrides.voice = { ...newOverrides.voice, [voice]: newValue };

      this.client.provider.set(id, 'overrides', newOverrides);

      return message.say(
        `Set \`${output}\` to override \`${pattern}\` ${voice === 'all' ? 'for all voices' : `for voice \`${voice}\``}`
      );
    }

    return message.say(`\`\`\`json\n${JSON.stringify(args)}\`\`\``);
  }
}
