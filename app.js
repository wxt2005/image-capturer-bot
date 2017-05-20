'use strict';

module.exports = app => {
  app.beforeStart(function* () {
    const { config: { twitterAuth, dropboxToken, botToken } } = app;

    if (!twitterAuth || !dropboxToken || !botToken) {
      throw new Error('You must specific tokens! Check your config file');
    }
  });
};
