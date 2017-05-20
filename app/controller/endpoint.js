'use strict';

module.exports = app => {
  class EndpointController extends app.Controller {
    * message() {
      const { ctx } = this;
      const { request: { body } } = ctx;

      const { message: { text } } = body;
      let resources = [];

      if (text && /https?:\/\/twitter\.com/.test(text)) {
        resources = yield ctx.service.twitter.extractMedia(text);

        if (resources.length) {
          yield ctx.service.dropbox.uploadMedia({ type: 'twitter', resources });
        }
      }

      ctx.body = { success: true, result: resources };
    }
  }

  return EndpointController;
};
