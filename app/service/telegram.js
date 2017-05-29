'use strict';

const _ = require('lodash');
const { botToken, channelAccount } = require('../../config/tokens');
const getMethodUrl = _.partial(require('../utils/telegramTools').getMethodUrl, botToken);


module.exports = app => {
  class TelegramService extends app.Service {
    * sendMediaByUrls({ resources = [] } = {}) {
      const { ctx } = this;

      if (!Array.isArray(resources) || !resources.length) {
        return [];
      }

      const methodUrls = {
        photo: getMethodUrl('sendPhoto'),
        video: getMethodUrl('sendVideo'),
      };

      const results = yield resources.map(({ url, type }) => ctx.curl(methodUrls[type], {
        method: 'POST',
        contentType: 'json',
        data: {
          chat_id: channelAccount,
          [type]: url,
        },
      }).then(response => response.data.toString()));

      return results;
    }
  }

  return TelegramService;
};
