import S3 from 'aws-sdk/clients/s3';
import btoa from 'btoa';
import fetch from 'node-fetch';
import fs from 'promise-fs';

import VoiceParser from 'config/VoiceParser';

import { defaultVoice, api, s3 } from 'settings';

const request = (action, parameters = '') => `${api.quotes}/${action}?${parameters}`;

const APIHandler = {
  makeRequest: (url, options = { method: 'GET' }) => fetch(url, options).catch(console.error),

  getQuotes: async (guilds) => {
    const parsedGuilds = [guilds].flat();
    const params = parsedGuilds.map((id) => `guilds[]=${id}`).join('&');

    const url = request('getQuotes.php', params);

    const result = await APIHandler.makeRequest(url);
    return result.json();
  },

  setQuotes: async (params) => {
    const { action } = params;

    if (action) {
      const url = request('setQuotes.php');
      const body = Object.keys(params)
        .map((key) => `${key}=${typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key]}`)
        .join('&');

      const response = await APIHandler.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf8',
        },
        body,
      });

      return response.json();
    }
    return { errors: ['action parameter not set'] };
  },

  s3Upload: async ({ filePath, id, name }) => {
    const { bucket, ...credentials } = s3;
    const file = await fs.readFile(filePath);
    const parameters = {
      Bucket: bucket,
      Key: [id, name].join('/'), // File name you want to save as in S3
      Body: file,
    };
    const client = new S3(credentials);
    client.upload(parameters, (err, data) => {
      if (err) throw err;
      console.info(`File uploaded successfully. ${data.Location}`);
    });
  },

  purgeS3Bucket: async ({ provider, id, oldClient = null, StartAfter = null }) => {
    const { bucket, ...credentials } = s3;
    const quotes = provider.get(id, 'quotes', []);
    const overrides = await provider.get(id, 'overrides', { voice: {}, text: [] });

    const parser = new VoiceParser({ overrides });
    const hashes = await Promise.all(
      quotes.map(async (quote) => {
        const { hash } = await parser.getAudioHash(quote);
        return `${id}/${hash}.mp3`;
      })
    );

    const parameters = {
      Bucket: bucket,
      Prefix: `${id}/`,
      ...(StartAfter ? { StartAfter } : {}),
    };

    const client = oldClient || new S3(credentials);
    client.listObjectsV2(parameters, (err, data) => {
      if (err) throw err;
      const { Contents: content, ContinuationToken } = data;
      const files = content.filter(({ Key: name }) => !hashes.includes(name)).map(({ Key }) => ({ Key }));

      if (files.length > 0) {
        client.deleteObjects({ Bucket: bucket, Delete: { Objects: files, Quiet: true } }, (error) => {
          if (error) throw error;
          console.info(`Purge completed, ${files.length} file(s) removed`);
        });
      } else console.info('Purge completed, no files removed');

      if (ContinuationToken) {
        const { Key: lastKey } = content[content.length - 1];
        APIHandler.purgeS3Bucket({ provider, id, oldClient: client, StartAfter: lastKey });
      }
    });
  },

  getAudio: async ({ quote, author, voiceId }) => {
    const voice = btoa(voiceId || defaultVoice);
    const object = btoa(JSON.stringify({ quote, author }));
    const url = `${api.voice}?object=${object}&voiceId=${voice}`;

    const response = await APIHandler.makeRequest(url);
    const { audio } = await response.json();

    return audio;
  },
};

export default APIHandler;
