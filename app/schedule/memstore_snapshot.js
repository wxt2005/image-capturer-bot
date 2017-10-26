'use strict';

module.exports = {
  schedule: {
    interval: '1m', // 1 分钟间隔
    type: 'worker', // 指定所有的 worker 都需要执行
  },

  * task(ctx) {
    const { app: { memStore } } = ctx;
    yield memStore.saveSnapshot();
  },
};
