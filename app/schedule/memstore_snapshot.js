'use strict';

module.exports = app => {
  return {
    schedule: {
      interval: app.config.memStore.saveSnapshotInterval,
      type: 'worker',
    },

    * task(ctx) {
      const { app: { memStore } } = ctx;
      yield memStore.saveSnapshot();
    },
  };
};
