import { fieldFunctions } from 'meta/shared';

const argumentFunctions = {
  field: { ...fieldFunctions, oneOf: [...fieldFunctions.oneOf, 'all'] },
};

const { field } = argumentFunctions;

const args = [
  {
    key: 'field',
    prompt: 'No field',
    type: 'string',
    default: 'all',
    ...field,
  },
  {
    key: 'query',
    prompt: 'No query',
    type: 'string',
    default: 'Hark Dand',
  },
];

const aliases = ['search', 'lookup', 'find'];
const examples = ['!search quote Hark', '!search author "Hark Dand"'];

export { args, aliases, examples };
