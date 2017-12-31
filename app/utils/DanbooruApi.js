'use strict';

const urllib = require('urllib');

const BASE_URL = 'https://danbooru.donmai.us';
const NEED_FORMAT_KEY = [ 'large_file_url', 'file_url', 'preview_file_url' ];

class DanbooruApi {
  constructor({ login, api_key } = {}) {
    if (!login || !api_key) {
      throw new Error('Login and Api_key must be specifed');
    }

    this.login = login;
    this.api_key = api_key;
  }

  getPost(postId) {
    if (!postId) {
      throw new TypeError('Post Id invalid');
    }
    return urllib.request(`${BASE_URL}/posts/${postId}.json`, {
      method: 'GET',
      auth: `${this.login}:${this.api_key}`,
      dataType: 'json',
    })
      .then(response => response.data)
      .then(data => {
        for (const key of NEED_FORMAT_KEY) {
          data[key] = `${BASE_URL}${data[key]}`;
        }
        return data;
      });
  }
}

module.exports = DanbooruApi;
