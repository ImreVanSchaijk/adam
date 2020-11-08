import fs from 'fs';
import path from 'path';

const groups = fs
  .readdirSync(path.resolve(__dirname, './'))
  .filter((file) => !file.endsWith('.js'))
  .map((file) => {
    const [first, ...rest] = file;

    return [file, `${first.toUpperCase()}${rest.join('')}`];
  });

export default groups;
