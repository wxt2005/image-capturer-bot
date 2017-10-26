'use strict';

module.exports = () => {
  const config = {};

  // dropbox path
  config.dropboxSavePath = '/auto_capture';

  config.memStore = {
    directory: './snapshot',
    saveSnapshotInterval: '1h',
  };

  return config;
};
