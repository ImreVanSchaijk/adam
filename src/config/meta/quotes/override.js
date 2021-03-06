import i18n from 'translate';

import allVoices from 'config/voices.json';

import { defaultVoice } from 'settings';

const validateLength = ({ length }) => length > 0 || i18n.translate('The entered value is too short.');

const validateVoiceId = (usedVoice) => {
  const matchesVoice = Object.values(allVoices)
    .flat()
    .some((voice) => voice.toLowerCase().startsWith(usedVoice.toLowerCase()));

  if (matchesVoice || usedVoice === 'all') return true;

  return i18n.translate(`{{name}} is not a valid name. You can use the !voices command to find all usable voices.`, {
    name: usedVoice,
  });
};

const parseVoiceId = (voice) => (voice === 'all' ? voice : `${voice.toLowerCase().replace(/(22k)/, '')}22k`);

const aliases = ['addquote', 'add', 'append'];

const args = [
  {
    key: 'type',
    prompt: i18n.translate('No type provided, please select either voice or text.'),
    type: 'string',
    oneOf: ['voice', 'text', 'clear', 'list'],
  },
  {
    key: 'pattern',
    prompt: i18n.translate('No search pattern provided, please enter the value you wish to override.'),
    type: 'string',
    validate: validateLength,
    default: '',
  },
  {
    key: 'output',
    prompt: i18n.translate('No output provided, please enter the output value of the override.'),
    type: 'string',
    validate: validateLength,
    default: '',
  },
  {
    key: 'voice',
    prompt: 'No voice',
    type: 'string',
    default: defaultVoice,
    validate: validateVoiceId,
    parse: parseVoiceId,
  },
  {
    key: 'clear',
    type: 'string',
    prompt: 'test',
    default: '',
  },
];

export { args, aliases };
