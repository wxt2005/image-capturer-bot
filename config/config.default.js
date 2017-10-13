'use strict';

const tokens = require('./tokens');

module.exports = appInfo => {
  const config = {};

  // change it
  config.keys = appInfo.name + '_1495301965697_6640';

  // dropbox path
  config.dropboxSavePath = '/auto_capture_test';

  // ignore json CSRF for now
  config.security = {
    csrf: {
      ignoreJSON: true,
    },
  };

  config.memcached = {
    client: {
      hosts: [ '127.0.0.1:11211' ], // The memcached cluster list.
    },
  };

  Object.assign(config, tokens);

  return config;
};
