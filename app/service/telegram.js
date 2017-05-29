'use strict';

const _ = require('lodash');
const FormStream = require('formstream');
const { botToken, channelAccount } = require('../../config/tokens');
const getMethodUrl = _.partial(require('../utils/telegramTools').getMethodUrl, botToken);


const methodUrls = {
  photo: getMethodUrl('sendPhoto'),
  video: getMethodUrl('sendVideo'),
};

module.exports = app => {
  class TelegramService extends app.Service {
    * sendMediaByUrls({ resources = [] } = {}) {
      const { ctx } = this;

      if (!Array.isArray(resources) || !resources.length) {
        return [];
      }

      const results = yield resources.map(({ url, type }) => ctx.curl(methodUrls[type], {
        method: 'POST',
        contentType: 'json',
        data: {
          chat_id: channelAccount,
          [type]: url,
        },
        dataType: 'json',
      }).then(response => response.data));

      return results;
    }

    * sendMediaByStreams({ resources = [] } = {}) {
      const { ctx } = this;

      if (!Array.isArray(resources) || !resources.length) {
        return [];
      }

      const results = yield resources.map(({ type, stream, fileName }) => {
        const form = new FormStream();

        form.field('chat_id', channelAccount);
        form.stream(type, stream, fileName);

        return ctx.curl(methodUrls[type], {
          method: 'POST',
          headers: form.headers(),
          stream: form,
          dataType: 'json',
          timeout: [ 5000, 300000 ],
        })
        .then(response => response.data);
      });

      return results;
    }

    * sendMedia({ resources = [] } = {}) {
      // you should fill in channelAccount to send message
      if (!channelAccount) {
        return [];
      }

      if (!Array.isArray(resources) || !resources.length) {
        return [];
      }

      const [ pendingStreams, pendingUrls ] = _.partition(resources, resource => !!resource.stream);

      return yield [
        ...this.sendMediaByStreams({ resources: pendingStreams }),
        ...this.sendMediaByUrls({ resources: pendingUrls }),
      ];
    }
  }

  return TelegramService;
};
