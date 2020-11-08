import i18n from 'i18n';
import path from 'path';

i18n.configure({
  locales: ['en'],
  directory: path.join(__dirname, './locales'),
});

const { __: translate } = i18n;
i18n.translate = translate;

export default i18n;
