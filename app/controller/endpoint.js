'use strict';

const _ = require('lodash');
const md5 = require('md5');
const urlUtils = require('url');
const { extractUrlsFromMessage, extractFullSizePhotoObject } = require('../utils/telegramTools');
const isDebug = require('debug')('*').enabled;

const TWITTER_HOSTNAME = /^(?:www\.)?twitter\.com$/i;
const PIXIV_HOSTNAME = /^(?:www|touch)\.pixiv\.net$/i;
const TUMBLR_HOSTNAME = /tumblr\.com$/i;

module.exports = app => {
  class EndpointController extends app.Controller {
    * message() {
      const { ctx } = this;
      const { request: { body }, app: { memStore } } = ctx;

      ctx.logger.info('Received message', JSON.stringify(body));

      let message = body.message || null;
      let force = false;

      if (body.callback_query) {
        const { from: { id: userId }, message: { message_id: messageId, chat: { id: chatId } }, data } = body.callback_query;
        const jsonData = JSON.parse(data);

        if (jsonData.like) {
          yield ctx.service.telegram.updateButtons({
            messageId,
            chatId,
            data: jsonData,
            userId,
          });

          ctx.body = {
            success: true,
          };

          return;
        } else if (jsonData.force) {
          message = body.callback_query.message;
          force = true;
        }
      }

      if (!message) {
        ctx.body = {
          success: false,
        };

        return;
      }

      const { chat: { id: chatId }, message_id: messageId } = message;

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

        const urlMD5 = md5(url);
        const memKey = `urls.${urlMD5}`;
        const existMemValue = memStore.get(memKey);

        if (!isDebug && !force && existMemValue) {
          ctx.logger.info(`Duplicate image url: ${url}`);

          yield ctx.service.telegram.sendDuplicateUrlMessage({
            chatId,
            messageId,
            url,
          });

          continue;
        }

        yield memStore.set(memKey, true);

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
