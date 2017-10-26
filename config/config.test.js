'use strict';

module.exports = () => {
  console.log('test');
  const config = {};

  config.memStore = {
    directory: './snapshot_test',
  };

  return config;
};
