'use strict';

const { extractMedia } = require('../utils/twitterTools');
const urlUtils = require('url');

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

      yield twitterClient.get('statuses/show', { id: tweetId })
        .then(tweet => {
          const { extended_entities: { media } = {} } = tweet;
          if (!media || !media.length) {
            return;
          }

          // filename format: @username_hash.png
          resources = extractMedia(media).map(mediaObject => Object.assign(
            {}, mediaObject, { fileName: `@${username}_${mediaObject.fileName}` }));
        })
        .catch(error => {
          throw error;
        });

      return resources;
    }
  }

  return TwitterService;
};
