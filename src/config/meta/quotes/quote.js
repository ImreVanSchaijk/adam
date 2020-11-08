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

const aliases = ['quoteplz', 'getquote'];

export { args, aliases };
