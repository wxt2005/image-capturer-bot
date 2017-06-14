'use strict';

const _ = require('lodash');
const urlUtils = require('url');
const { extractUrlsFromMessage } = require('../utils/telegramTools');

const TWITTER_HOSTNAME = /^(?:www\.)?twitter\.com$/i;
const PIXIV_HOSTNAME = /^(?:www|touch)\.pixiv\.net$/i;

module.exports = app => {
  class EndpointController extends app.Controller {
    * message() {
      const { ctx } = this;
      const { request: { body } } = ctx;

      ctx.logger.info('Received message', JSON.stringify(body));

      const { message } = body;

      if (!message) {
        ctx.body = {
          success: false,
        };

        return;
      }

      const urls = extractUrlsFromMessage(message);
      let resources = [];
      let uploadPendingList = [];

      for (const url of urls) {
        const parsedUrl = urlUtils.parse(url);
        let resourcesOfCurrentUrl = [];

        // twitter
        if (TWITTER_HOSTNAME.test(parsedUrl.hostname)) {
          resourcesOfCurrentUrl = yield ctx.service.twitter.extractMedia(url);

          if (resourcesOfCurrentUrl.length) {
            uploadPendingList = [ ...uploadPendingList, { type: 'twitter', resources: resourcesOfCurrentUrl }];
          }
        }

        // pixiv
        if (PIXIV_HOSTNAME.test(parsedUrl.hostname)) {
          resourcesOfCurrentUrl = yield ctx.service.pixiv.extractMedia(url);

          if (resourcesOfCurrentUrl.length) {
            uploadPendingList = [ ...uploadPendingList, { type: 'pixiv', resources: resourcesOfCurrentUrl }];
          }
        }

        resources = [ ...resources, ...resourcesOfCurrentUrl ];
      }

      if (app.config.dropboxToken) {
        yield uploadPendingList.map(item => ctx.service.dropbox.uploadMedia(item));
      }

      if (app.config.channelAccount) {
        yield uploadPendingList.map(item => ctx.service.telegram.sendMedia(item));
      }

      if (app.config.wechatEndpoint) {
        yield uploadPendingList.map(item => ctx.service.wechat.sendImages(item));
      }

      ctx.body = {
        success: true,
        result: _.map(resources, resource => _.omit(resource, [ 'stream' ])),
      };
    }
  }

  return EndpointController;
};
