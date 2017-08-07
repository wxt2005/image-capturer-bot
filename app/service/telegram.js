'use strict';

const _ = require('lodash');
const FormStream = require('formstream');
const { botToken, channelAccount } = require('../../config/tokens');
const getMethodUrl = _.partial(require('../utils/telegramTools').getMethodUrl, botToken);


const methodUrls = {
  photo: getMethodUrl('sendPhoto'),
  video: getMethodUrl('sendVideo'),
  document: getMethodUrl('sendDocument'),
  getFile: getMethodUrl('getFile'),
};

module.exports = app => {
  class TelegramService extends app.Service {
    * sendMediaByUrls({ resources = [] } = {}) {
      const { ctx } = this;

      if (!Array.isArray(resources) || !resources.length) {
        return [];
      }

      const results = yield resources.map(({ url, type, source, fileId }) => ctx.curl(methodUrls[type], {
        method: 'POST',
        contentType: 'json',
        data: {
          chat_id: channelAccount,
          [type]: fileId || url,
          caption: source,
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

      const results = yield resources.map(({ type, stream, fileName, source }) => {
        const form = new FormStream();

        form.field('chat_id', channelAccount);
        form.field('caption', source);
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

    * getFileUrls({ fileIds = [] } = {}) {
      const { ctx } = this;

      return yield Promise.all(fileIds.map(fileId => {
        return ctx.curl(`${methodUrls.getFile}?file_id=${fileId}`, {
          timeout: [ 5000, 40000 ],
          dataType: 'json',
          gzip: true,
        })
          .then(response => {
            if (response.status === 200 && response.data.ok && response.data.result.file_path) {
              const filePath = response.data.result.file_path;
              const extension = /\.(\w+)$/gi.exec(filePath)[1];
              return {
                url: `https://api.telegram.org/file/bot${botToken}/${filePath}`,
                fileId,
                fileName: `${fileId}.${extension}`,
                type: 'photo',
              };
            }

            return null;
          })
          .catch(error => {
            ctx.logger.warn(error);

            return null;
          });
      }))
        .then(results => results.filter(resource => !!resource))
        .catch(error => {
          ctx.logger.warn(error);

          return [];
        });
    }
  }

  return TelegramService;
};
