'use strict';

const { extractMedia } = require('../utils/twitterTools');

module.exports = app => {
  class TwitterService extends app.Service {
    * extractMedia(tweetUrl) {
      const { twitterClient } = app;
      const TWEET_ID_REGEXP = /status\/(\d+)$/i;
      const matchResult = TWEET_ID_REGEXP.exec(tweetUrl);

      // cannot get tweet id
      if (!matchResult || matchResult.length < 2) {
        return [];
      }

      const tweetId = matchResult[1];
      let resources = [];

      yield twitterClient.get('statuses/show', { id: tweetId })
        .then(tweet => {
          const { extended_entities: { media } } = tweet;
          if (!media || !media.length) {
            return;
          }

          // console.dir(tweet.extended_entities.media, { depth: 10, colors: true });

          resources = extractMedia(media);
        })
        .catch(error => {
          throw error;
        });

      return resources;
    }
  }

  return TwitterService;
};
