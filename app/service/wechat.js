'use strict';

module.exports = app => {
  class WechatService extends app.Service {
    * sendImages({ resources = [] } = {}) {
      const { ctx } = this;
      const { wechatEndpoint } = app.config;

      for (const resource of resources) {
        // not supoort stream yet
        if (resource.stream) {
          continue;
        }

        console.log(resource);

        yield ctx.curl(wechatEndpoint, {
          method: 'POST',
          data: {
            fileUrl: resource.url,
            filename: resource.fileName,
          },
        });
      }
    }
  }

  return WechatService;
};
