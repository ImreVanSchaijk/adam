import btoa from 'btoa';
import fetch from 'node-fetch';

import { defaultVoice, api } from 'settings';

const request = (action, parameters = '') => `${api.quotes}${action}?${parameters}`;

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
