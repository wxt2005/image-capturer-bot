'use strict';

const Twitter = require('twitter');
const TWITTER_CLIENT = Symbol('Application#twitterClient');

const Dropbox = require('dropbox');
const DROPBOX_CLIENT = Symbol('Application#dropboxClient');

module.exports = {
  get twitterClient() {
    if (!this[TWITTER_CLIENT]) {
      this[TWITTER_CLIENT] = new Twitter(this.config.twitterAuth);
    }

    return this[TWITTER_CLIENT];
  },

  get dropboxClient() {
    if (!this[DROPBOX_CLIENT]) {
      this[DROPBOX_CLIENT] = new Dropbox({
        accessToken: this.config.dropboxToken,
      });
    }

    return this[DROPBOX_CLIENT];
  },
};
