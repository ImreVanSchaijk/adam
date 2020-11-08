import i18n from 'i18n';

import { api } from 'settings';
import { indexFunctions, fieldFunctions } from 'meta/shared';

const argumentFunctions = {
  field: { ...fieldFunctions },
  index: { ...indexFunctions },
  newContent: {
    parse: (value, { content }) => {
      const editAudio = content.match(/!edit\s*audio(Id)?/g);
      const editVoice = content.match(/!edit\s*voice(Id)?/g);
      if (editVoice) {
        return `${value.replace(/22k/g, '')}22k`;
      }
      if (editAudio && value.endsWith('.mp3') && !value.includes('https')) {
        return `${api.audio}/${value}`;
      }
      return value;
    },
  },
};

const { field, index, newContent } = argumentFunctions;

const args = [
  {
    key: 'field',
    prompt: i18n.translate('Please provide the field you wish to edit.'),
    type: 'string',
    ...field,
  },
  {
    key: 'index',
    prompt: i18n.translate('Please provide an index for the quote you wish to edit.'),
    type: 'integer',
    default: -1,
    ...index,
  },
  {
    key: 'newContent',
    prompt: i18n.translate('No new content'),
    type: 'string',
    default: '',
    ...newContent,
  },
];

const aliases = ['update'];

export { args, aliases };
