'use strict';

module.exports = app => {
  class EndpointController extends app.Controller {
    * message() {
      const { ctx } = this;
      const { request: { body } } = ctx;

      const { message: { text } } = body;
      let media = '';

      if (text && /https?:\/\/twitter\.com/.test(text)) {
        media = yield ctx.service.twitter.extractMedia(text);
        yield ctx.service.dropbox.uploadMedia({ type: 'twitter', media });
      }

      ctx.body = { success: true, result: media };
    }
  }

  return EndpointController;
};
