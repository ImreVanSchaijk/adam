import APIHandler from 'config/APIHandler';

const sort = ({ quote, author, contributor, timestamp, audio, voiceId, embed }) => ({
  quote,
  author,
  contributor,
  timestamp,
  audio,
  voiceId,
  embed,
});

export default class VoiceParser {
  constructor({ overrides }) {
    this.voiceOverrides = overrides.voice;
    this.textOverrides = overrides.text;
  }

  async run({ quote, author, voiceId, ...rest }) {
    const voiceNeedles = [];
    const voiceTargets = [];

    if (!this.voiceOverrides[voiceId]) {
      this.voiceOverrides[voiceId] = [];
    }

    Object.values(this.voiceOverrides[voiceId]).forEach(([needle, target]) => {
      voiceNeedles.push(needle);
      voiceTargets.push(target);
    });

    const keys = {
      text: Object.keys(this.textOverrides).join('|'),
      voice: voiceNeedles.join('|'),
    };

    const patterns = { text: new RegExp(`-(${keys.text})-`, 'g'), voice: new RegExp(`(${keys.voice})`, 'g') };

    const textObject = {
      quote: quote.replace(patterns.text, (_, match) => this.textOverrides[match]),
      author: author.replace(patterns.text, (_, match) => this.textOverrides[match]),
    };

    const audioReplace = (_, match) => {
      const arrayMatch = voiceNeedles.find((value) => new RegExp(match, 'g').test(value));
      return voiceTargets[voiceNeedles.indexOf(arrayMatch)] || match;
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
  }
}
