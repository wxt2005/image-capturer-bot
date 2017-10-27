'use strict';

module.exports = () => {
  const config = {};

  config.memStore = {
    directory: './snapshot_test',
  };

  return config;
};
