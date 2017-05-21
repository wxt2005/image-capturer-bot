'use strict';

const Twitter = require('twitter');
const TWITTER_CLIENT = Symbol('Application#twitterClient');

const Dropbox = require('dropbox');
const DROPBOX_CLIENT = Symbol('Application#dropboxClient');

const dropboxStream = require('dropbox-stream');

module.exports = {
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
};
