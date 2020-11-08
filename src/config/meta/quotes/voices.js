import i18n from 'i18n';
import allVoices from 'config/voices.json';

const languages = Object.keys(allVoices).map(([first, ...rest]) => {
  const cleanOutput = rest.join('').replace(/_([(]?[a-zA-Z])/g, (a, value) => ` ${value.toUpperCase()}`);

  return `${first.toUpperCase()}${cleanOutput}`;
});

const languagesTlc = languages.map((language) => language.toLowerCase());

const argumentFunctions = {
  language: {
    validate: (language) => {
      const languageExists = languagesTlc.includes(language.toLowerCase());
      const closeEnough = languagesTlc.filter((lang) => lang.startsWith(language)).length === 1;

      return (
        languageExists || closeEnough || i18n.translate('The language {{language}} is not available.', { language })
      );
    },
    parse: (language) => {
      let parsedLanguage = language;
      const startsWith = languagesTlc.filter((lang) => lang.startsWith(language));
      if (startsWith.length === 1) {
        [parsedLanguage] = startsWith;
      }

      return parsedLanguage.replace(/[ ]/g, '_');
    },
  },
};

const { language } = argumentFunctions;

const args = [
  {
    key: 'language',
    prompt: i18n.translate(`Please select one of the following languages:\n\n{{languageList}}`, {
      languageList: languages.join('\n'),
    }),
    type: 'string',
    validate: language.validate,
    parse: language.parse,
  },
];

const aliases = ['voice'];

export { args, aliases };
