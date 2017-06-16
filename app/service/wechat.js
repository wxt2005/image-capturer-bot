'use strict';

module.exports = app => {
  class WechatService extends app.Service {
    * sendImages({ resources = [] } = {}) {
      const { ctx } = this;
      const { wechatEndpoint } = app.config;

      for (const resource of resources) {
        yield ctx.curl(wechatEndpoint, {
          method: 'POST',
          data: {
            fileUrl: resource.url,
            filename: resource.fileName,
          },
          timeout: [ 10000, 30000 ],
        });
      }
    }
  }

  return WechatService;
};
