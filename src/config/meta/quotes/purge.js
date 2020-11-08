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

const examples = ['purge 115'];

export { args, examples };
