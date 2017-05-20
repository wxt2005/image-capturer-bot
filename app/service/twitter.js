'use strict';

module.exports = app => {
  class TwitterService extends app.Service {
    * extractMedia(tweetUrl) {
      const { twitterClient } = app;
      const TWEET_ID_REGEXP = /status\/(\d+)$/i;
      const matchResult = TWEET_ID_REGEXP.exec(tweetUrl);

      if (!matchResult || matchResult.length !== 2) {
        return null;
      }

      const tweetId = matchResult[1];
      let result = [];
      yield twitterClient.get('statuses/show', { id: tweetId })
        .then(tweet => {
          const { entities: { media } } = tweet;
          if (!media || !media.length) {
            return;
          }

          result = media.map(item => item.media_url);
        })
        .catch(error => {
          throw error;
        });

      return result;
    }
  }

  return TwitterService;
};
