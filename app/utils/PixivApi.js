'use strict';

const urllib = require('urllib');

const BASE_URL = 'https://app-api.pixiv.net';
const CLIENT_ID = 'KzEZED7aC0vird8jWyHM38mXjNTY';
const CLIENT_SECRET = 'W9JZoJe00qPvJsiyCGT3CCtC6ZUtdpKpzMbNlUGP';
const filter = 'for_ios';

class PixivApi {
  constructor({ username, password } = {}) {
    this.username = username || '';
    this.password = password || '';
    this.auth = null;
    this.lastAuthTime = new Date(0);

    this._login();
  }

  /**
   * Login to pixiv
   * @private
   * @return {Pormise} promise
   */
  _login() {
    if (!this.username || !this.password) {
      return Promise.reject(new Error('User auth info is wrong'));
    }

    const requestData = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      get_secure_url: 1,
      grant_type: 'password',
      username: this.username,
      password: this.password,
      device_token: 'pixiv',
    };

    return urllib.request('https://oauth.secure.pixiv.net/auth/token', {
      method: 'POST',
      data: requestData,
      dataType: 'json',
    })
      .then(response => {
        this.auth = response.data.response;
        this.lastAuthTime = Date.now();

        return response.data.response;
      })
      .catch(err => {
        throw err;
      });
  }

  /**
   * Refresh token
   * @private
   * @return {Pormise} promise
   */
  _refreshToken() {
    if (!this.auth || !this.auth.refresh_token) {
      return Promise.reject(new Error('Not auth before'));
    }

    const requestData = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      get_secure_url: 1,
      grant_type: 'refresh_token',
      refresh_token: this.auth.refresh_token,
    };

    return urllib.request('https://oauth.secure.pixiv.net/auth/token', {
      method: 'POST',
      data: requestData,
      dataType: 'json',
    })
      .then(response => {
        this.auth = response.data.response;
        this.lastAuthTime = Date.now();

        return response.data.response;
      })
      .catch(err => {
        throw err;
      });
  }

  /**
   * Build in request method
   * @private
   * @param  {String} url          request url
   * @param  {Object} [options={}] options
   * @return {Promise}              promise
   */
  _request(url, options = {}) {
    if (!url) {
      return Promise.reject(new Error('You musct specified url'));
    }

    let authPromise = Promise.resolve();

    if (!this.auth) {
      authPromise = this._login();
    } else if (Date.now() - this.lastAuthTime >= this.auth.expires_in * 1000) {
      authPromise = this._refreshToken();
    }

    return authPromise.then(() => {
      options.headers = Object.assign({
        'App-OS': 'ios',
        'App-OS-Version': '9.3.3',
        'App-Version': '6.1.2',
        'User-Agent': 'PixivIOSApp/6.1.2 (iOS 9.0; iPhone8,2)',
        Authorization: `Bearer ${this.auth.access_token}`,
      }, options.headers || {});

      options.dataType = options.dataType || 'json';

      return urllib.request(url, options);
    })
      .then(response => response.data);
  }

  /**
   * Fetch illustration detail
   * @public
   * @param  {String} illustId illust id
   * @return {Promise}          promise
   */
  illustDetail(illustId) {
    return this._request(`${BASE_URL}/v1/illust/detail`, {
      data: {
        filter,
        illust_id: illustId,
      },
    });
  }
}

module.exports = PixivApi;
