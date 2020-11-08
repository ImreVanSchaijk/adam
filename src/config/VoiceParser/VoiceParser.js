import sortObject from 'sort-object-keys';

import APIHandler from 'config/APIHandler';

import textOverrides from './_text.json';
import voiceOverrides from './_voice.json';

const sort = ({ quote, author, contributor, timestamp, audio, voiceId, embed }) => ({
  quote,
  author,
  contributor,
  timestamp,
  audio,
  voiceId,
  embed,
});

const VoiceParser = {
  parse: async ({ quote, author, voiceId, ...rest }) => {
    const voice = voiceId.replace('22k', '');
    const voiceNeedles = [];
    const voiceTargets = [];

    Object.values(voiceOverrides[voice]).forEach(([needle, target]) => {
      voiceNeedles.push(needle);
      voiceTargets.push(target);
    });

    const keys = {
      text: Object.keys(textOverrides).join('|'),
      voice: voiceNeedles.join('|'),
    };

    const patterns = { text: new RegExp(`-(${keys.text})-`, 'g'), voice: new RegExp(`(${keys.voice})`, 'g') };

    const textObject = {
      quote: quote.replace(patterns.text, (_, match) => textOverrides[match]),
      author: author.replace(patterns.text, (_, match) => textOverrides[match]),
    };

    const audioReplace = (_, match) => {
      const arrayMatch = voiceNeedles.find((value) => new RegExp(match, 'g').test(value));
      return voiceTargets[voiceNeedles.indexOf(arrayMatch)];
    };

    const audioObject = {
      quote: textObject.quote.replace(patterns.voice, audioReplace),
      author: textObject.author.replace(patterns.voice, audioReplace),
    };

    const audio = await APIHandler.getAudio({ quote: audioObject.quote, author: audioObject.author, voiceId });

    return sort({
      ...rest,
      quote: textObject.quote,
      author: textObject.author,
      voiceId,
      audio,
    });
  },
};

export default VoiceParser;

VoiceParser.parse({
  quote: 'This quote contains -FAKE- as well as a -LENNY- face, it also mentions Opa Harry',
  author: 'joch with -LENNY-',
  voiceId: 'willoldman22k',
});
