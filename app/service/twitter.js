'use strict';

const { extractMedia } = require('../utils/twitterTools');
const urlUtils = require('url');
const debug = require('debug')('bot:twitter');

module.exports = app => {
  class TwitterService extends app.Service {
    * extractMedia(tweetUrl) {
      const { twitterClient } = app;
      const parsedUrl = urlUtils.parse(tweetUrl);
      const TWEET_REGEXP = /^\/(.+?)\/status\/(\d+)$/i;
      const matchResult = TWEET_REGEXP.exec(parsedUrl.pathname);

      // twitter url not match
      if (!matchResult || matchResult.length < 3) {
        return [];
      }

      const [ , username, tweetId ] = matchResult;
      let resources = [];

      yield twitterClient.get('statuses/show', {
        id: tweetId,
        tweet_mode: 'extended',
      })
        .then(tweet => {
          debug('Received tweet %O', tweet);
          let media = [];
          const { entities, extended_entities } = tweet;

          if (Array.isArray(entities.media) && entities.media.length) {
            media = entities.media;
          }

          if (Array.isArray(extended_entities.media) && extended_entities.media.length >= media.length) {
            media = extended_entities.media;
          }

          if (!media || !media.length) {
            return;
          }

          // filename format: @username_hash.png
          resources = extractMedia(media).map(mediaObject => Object.assign(
            {}, mediaObject, {
              fileName: `@${username}_${mediaObject.fileName}`,
              source: tweetUrl,
            }));
        })
        .catch(error => {
          throw error;
        });

      return resources;
    }
  }

  return TwitterService;
};
