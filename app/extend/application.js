'use strict';

const Twitter = require('twitter');
const TWITTER_CLIENT = Symbol('Application#twitterClient');

const Dropbox = require('dropbox');
const DROPBOX_CLIENT = Symbol('Application#dropboxClient');

const Pixiv = require('../utils/PixivApi');
const PIXIV_CLIENT = Symbol('Application#PixivClient');

const dropboxStream = require('dropbox-stream');

const Store = require('./Store');
const MEM_STORE = Symbol('Application#MemStore');

const Danbooru = require('../utils/DanbooruApi');
const DANBOORU_CLIENT = Symbol('Application#DanbooruClient');

module.exports = {
  get memStore() {
    if (!this[MEM_STORE]) {
      this[MEM_STORE] = new Store({
        directory: this.config.memStore.directory,
      });
    }

    return this[MEM_STORE];
  },

  get twitterClient() {
    if (!this[TWITTER_CLIENT]) {
      this[TWITTER_CLIENT] = new Twitter(this.config.twitterAuth);
    }

    return this[TWITTER_CLIENT];
  },

  get dropboxClient() {
    if (!this[DROPBOX_CLIENT]) {
      const token = this.config.dropboxToken;

      this[DROPBOX_CLIENT] = new Dropbox({
        accessToken: token,
      });

      Object.assign(this[DROPBOX_CLIENT], {
        createUploadStream({ path, autorename = true } = {}) {
          if (!path) {
            throw new Error('Upload path must be specified');
          }

          return dropboxStream.createDropboxUploadStream({
            token,
            chunkSize: 1000 * 1024,
            filepath: path,
            autorename,
          });
        },
        createDownloadStream({ path } = {}) {
          if (!path) {
            throw new Error('Download path must be specified');
          }

          return dropboxStream.createDropboxDownloadStream({
            token,
            filepath: path,
          });
        },
      });
    }

    return this[DROPBOX_CLIENT];
  },

  get pixivClient() {
    if (!this[PIXIV_CLIENT]) {
      const { pixivAuth: { username, password } } = this.config;

      this[PIXIV_CLIENT] = new Pixiv({ username, password });
    }

    return this[PIXIV_CLIENT];
  },

  get danbooruClient() {
    if (!this[DANBOORU_CLIENT]) {
      const { danbooru: { login, api_key } } = this.config;

      this[DANBOORU_CLIENT] = new Danbooru({ login, api_key });
    }

    return this[DANBOORU_CLIENT];
  },
};
