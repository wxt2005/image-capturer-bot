'use strict';

const _ = require('lodash');
const { extractUrlsFromMessage } = require('../utils/telegramTools');

module.exports = app => {
  class EndpointController extends app.Controller {
    * message() {
      const { ctx } = this;
      const { request: { body } } = ctx;

      ctx.logger.info('Received message', JSON.stringify(body));

      const { message } = body;
      const urls = extractUrlsFromMessage(message);
      let resources = [];

      for (const url of urls) {
        let resourcesOfCurrentUrl = [];

        // twitter
        if (/^https?:\/\/twitter\.com/i.test(url)) {
          resourcesOfCurrentUrl = yield ctx.service.twitter.extractMedia(url);

          if (resourcesOfCurrentUrl.length) {
            yield ctx.service.dropbox.uploadMediaByUrls({ type: 'twitter', resources: resourcesOfCurrentUrl });
          }
        }

        // pixiv
        if (/^https?:\/\/www\.pixiv\.net/i.test(url)) {
          resourcesOfCurrentUrl = yield ctx.service.pixiv.extractMedia(url);

          if (resourcesOfCurrentUrl.length) {
            yield ctx.service.dropbox.uploadMediaByStreams({ type: 'pixiv', resources: resourcesOfCurrentUrl });
          }
        }

        resources = [ ...resources, ...resourcesOfCurrentUrl ];
      }


      ctx.body = {
        success: true,
        result: _.map(resources, resource => _.omit(resource, [ 'stream' ])),
      };
    }
  }

  return EndpointController;
};
