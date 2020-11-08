import { indexFunctions } from 'meta/shared';

const { validate, parse } = indexFunctions;

const args = [
  {
    key: 'index',
    prompt: 'No argument',
    default: '',
    validate,
    parse,
  },
];

const examples = ['info 115'];

export { args, examples };
