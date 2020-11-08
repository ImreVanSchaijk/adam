import i18n from 'translate';

import textRules from 'config/VoiceParser/_text.json';
import allVoices from 'config/voices.json';

import { defaultVoice } from 'settings';

const validateLength = ({ length }) => length > 0 || i18n.translate('Your quote is too short.');

const textParse = (val) => val.replace(/-(.*?)-/g, (a, value) => textRules[value] || value);

const validateVoiceId = (usedVoice) =>
  Object.values(allVoices)
    .flat()
    .some((voice) => voice.toLowerCase().startsWith(usedVoice.toLowerCase())) ||
  i18n.translate(`{{name}} is not a valid name. You can use the !voices command to find all usable voices.`, {
    name: usedVoice,
  });

const parseVoiceId = (voice) => `${voice.toLowerCase().replace(/(22k)/, '')}22k`;

const aliases = ['addquote', 'add', 'append'];

const args = [
  {
    key: 'quote',
    prompt: 'No quote',
    type: 'string',
    default: '',
    validate: validateLength,
    parse: textParse,
  },
  {
    key: 'author',
    prompt: 'No author',
    type: 'string',
    default: '',
    validate: validateLength,
    parse: textParse,
  },
  {
    key: 'voiceId',
    prompt: 'No voice',
    type: 'string',
    default: defaultVoice,
    validate: validateVoiceId,
    parse: parseVoiceId,
  },
];

export { args, aliases };
