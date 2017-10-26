'use strict';

const _ = require('lodash');
const urlUtils = require('url');
const { extractUrlsFromMessage, extractFullSizePhotoObject } = require('../utils/telegramTools');

const TWITTER_HOSTNAME = /^(?:www\.)?twitter\.com$/i;
const PIXIV_HOSTNAME = /^(?:www|touch)\.pixiv\.net$/i;
const TUMBLR_HOSTNAME = /tumblr\.com$/i;

module.exports = app => {
  class EndpointController extends app.Controller {
    * message() {
      const { ctx } = this;
      const { request: { body }, app: { memStore } } = ctx;

      ctx.logger.info('Received message', JSON.stringify(body));

      const { message, message: { chat: { id: chatId }, message_id: messageId } } = body;

      if (!message) {
        ctx.body = {
          success: false,
        };

        return;
      }

      let resources = [];
      let uploadPendingList = [];

      const urls = extractUrlsFromMessage(message);

      if (message.photo) {
        const photoObject = extractFullSizePhotoObject(message);
        const telegramFileResouces = yield ctx.service.telegram.getFileUrls({ fileIds: [ photoObject.file_id ] });

        if (telegramFileResouces.length) {
          uploadPendingList = [ ...uploadPendingList, { type: 'unknown', resources: telegramFileResouces }];
        }
      }

      for (const url of urls) {
        const parsedUrl = urlUtils.parse(url);
        let resourcesOfCurrentUrl = [];

        const memKey = encodeURIComponent(url);
        const existMemValue = memStore.get(memKey);

        if (existMemValue) {
          yield ctx.service.telegram.sendMessage({
            chatId,
            replyTo: messageId,
            message: '图片重复',
          });

          console.log(`${url} 图片重复`);

          continue;
        }

        yield memStore.set(memKey, {});

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

        if (TUMBLR_HOSTNAME.test(parsedUrl.hostname)) {
          resourcesOfCurrentUrl = yield ctx.service.tumblr.extractMedia(url);

          if (resourcesOfCurrentUrl.length) {
            uploadPendingList = [ ...uploadPendingList, { type: 'tumblr', resources: resourcesOfCurrentUrl }];
          }
        }

        resources = [ ...resources, ...resourcesOfCurrentUrl ];
      }

      if (app.config.dropboxToken) {
        try {
          yield uploadPendingList.map(item => ctx.service.dropbox.uploadMedia(item));
        } catch (e) {
          console.error(e);
        }
      }

      if (app.config.channelAccount) {
        try {
          yield uploadPendingList.map(item => ctx.service.telegram.sendMedia(item));
        } catch (e) {
          console.error(e);
        }
      }

      if (app.config.wechatEndpoint) {
        try {
          yield uploadPendingList.map(item => ctx.service.wechat.sendImages(item));
        } catch (e) {
          console.error(e);
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
