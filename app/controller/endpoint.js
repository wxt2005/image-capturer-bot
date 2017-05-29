'use strict';

const _ = require('lodash');
const urlUtils = require('url');
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
      let uploadPendingList = [];

      for (const url of urls) {
        const urlObject = urlUtils.parse(url);
        let resourcesOfCurrentUrl = [];

        // twitter
        if (urlObject.hostname === 'twitter.com') {
          resourcesOfCurrentUrl = yield ctx.service.twitter.extractMedia(url);

          if (resourcesOfCurrentUrl.length) {
            uploadPendingList = [ ...uploadPendingList, { type: 'twitter', resources: resourcesOfCurrentUrl }];
            // yield ctx.service.telegram.sendMediaByUrls({ type: 'twitter', resources: resourcesOfCurrentUrl });
          }
        }

        // pixiv
        if (urlObject.hostname === 'www.pixiv.net') {
          resourcesOfCurrentUrl = yield ctx.service.pixiv.extractMedia(url);

          if (resourcesOfCurrentUrl.length) {
            uploadPendingList = [ ...uploadPendingList, { type: 'pixiv', resources: resourcesOfCurrentUrl }];
          }
        }

        resources = [ ...resources, ...resourcesOfCurrentUrl ];
      }

      yield uploadPendingList.map(item => ctx.service.dropbox.uploadMedia(item));

      ctx.body = {
        success: true,
        result: _.map(resources, resource => _.omit(resource, [ 'stream' ])),
      };
    }
  }

  return EndpointController;
};
