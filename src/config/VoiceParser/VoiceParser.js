import APIHandler from 'config/APIHandler';
import shortHash from 'short-hash';

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

  async getAudioHash({ quote, author, voiceId }) {
    const obj = await this.run({ quote, author, voiceId }, false);

    return {
      hash: shortHash(JSON.stringify({ quote: obj.quote, author: obj.author, voiceId: obj.voiceId })),
      quote: obj.quote,
      author: obj.author,
      voiceId: obj.voiceId,
    };
  }

  async run({ quote, author, voiceId, ...rest }, generateAudio = true) {
    const voiceNeedles = [];
    const voiceTargets = [];

    if (!this.voiceOverrides[voiceId]) {
      this.voiceOverrides[voiceId] = [];
    }

    Object.values(this.voiceOverrides[voiceId]).forEach(([needle, target]) => {
      voiceNeedles.push(needle);
      voiceTargets.push(target);
    });

    Object.values(this.voiceOverrides.all || []).forEach(([needle, target]) => {
      if (!voiceNeedles.includes(needle)) voiceNeedles.push(needle);
      if (!voiceTargets.includes(target)) voiceTargets.push(target);
    });

    const keys = {
      text: Object.keys(this.textOverrides).join('|'),
      voice: voiceNeedles.map((needle) => needle.replace(/[(]/g, '\\(').replace(/[)]/g, '\\)')).join('|'),
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

    let audio;
    if (generateAudio) {
      audio = await APIHandler.getAudio({ quote: audioObject.quote, author: audioObject.author, voiceId });
    }

    return sort({
      ...rest,
      quote: (generateAudio ? textObject : audioObject).quote,
      author: (generateAudio ? textObject : audioObject).author,
      voiceId,
      audio: audio || rest.audio,
    });
  }
}
