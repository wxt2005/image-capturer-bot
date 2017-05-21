'use strict';

const _ = require('lodash');

module.exports = app => {
  class EndpointController extends app.Controller {
    * message() {
      const { ctx } = this;
      const { request: { body } } = ctx;

      const { message: { text } } = body;
      let resources = [];

      // twitter
      if (/^https?:\/\/twitter\.com/i.test(text)) {
        resources = yield ctx.service.twitter.extractMedia(text);

        if (resources.length) {
          yield ctx.service.dropbox.uploadMediaByUrls({ type: 'twitter', resources });
        }
      }

      // pixiv
      if (/^https?:\/\/www\.pixiv\.net/i.test(text)) {
        resources = yield ctx.service.pixiv.extractMedia(text);

        if (resources.length) {
          yield ctx.service.dropbox.uploadMediaByStreams({ type: 'pixiv', resources });
        }
      }

      ctx.body = {
        success: true,
        result: _.map(resources, resource => _.omit(resource, [ 'stream' ])),
      };
    }
  }

  return EndpointController;
};
