import { indexFunctions } from 'meta/shared';

const { validate, parse } = indexFunctions;

const args = [
  {
    key: 'index',
    prompt: 'No argument',
    default: 'list',
    validate,
    parse,
  },
];

const examples = ['getAudioHash 115'];

export { args, examples };
