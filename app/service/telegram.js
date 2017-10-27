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
  sendMessage: getMethodUrl('sendMessage'),
  editMessageReplyMarkup: getMethodUrl('editMessageReplyMarkup'),
};

const inlineKeyboardMarkup = JSON.stringify({
  inline_keyboard: [[
    {
      text: 'Like',
      callback_data: JSON.stringify({ like: true }),
    },
  ]],
});

module.exports = app => {
  class TelegramService extends app.Service {
    * updateButtons({ chatId, messageId, userId, data } = {}) {
      if (!chatId || !messageId || !data || !userId) {
        return null;
      }

      const { ctx, ctx: { app: { memStore } } } = this;

      const memPath = `messages.chat_${chatId}.msg_${messageId}`;
      const messageData = memStore.get(memPath);
      let jsonData = {};

      try {
        jsonData = JSON.parse(data);
      } catch (e) {
        return;
      }

      if (!messageData) {
        return;
      }

      if (jsonData.like) {
        if (Array.isArray(messageData.likeUsers) && messageData.likeUsers.includes(userId)) {
          console.log(`Duplicate like, userId: ${userId}`);
          return;
        }

        messageData.likes++;

        if (!messageData.likeUsers) {
          messageData.likeUsers = [];
        }

        messageData.likeUsers.push(userId);

        yield ctx.curl(methodUrls.editMessageReplyMarkup, {
          method: 'POST',
          contentType: 'json',
          data: {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: JSON.stringify({
              inline_keyboard: [[
                {
                  text: `Like (${messageData.likes})`,
                  callback_data: JSON.stringify({ like: true }),
                },
              ]],
            }),
          },
          dataType: 'json',
        }).then(response => response.data);

        yield memStore.set(memPath, messageData);
      }
    }

    * sendMessage({ chatId, message, replyTo } = {}) {
      const { ctx } = this;

      if (!message) {
        return null;
      }

      const results = yield ctx.curl(methodUrls.sendMessage, {
        method: 'POST',
        contentType: 'json',
        data: {
          chat_id: chatId,
          text: message,
          reply_to_message_id: replyTo,
          disable_web_page_preview: true,
        },
        dataType: 'json',
      }).then(response => response.data);

      return results;
    }

    * sendMediaByUrls({ resources = [], withLikeButton = false } = {}) {
      const { ctx } = this;

      if (!Array.isArray(resources) || !resources.length) {
        return [];
      }

      const results = yield resources.map(({ url, type, source, fileId }) => {
        const requestObj = {
          method: 'POST',
          contentType: 'json',
          data: {
            chat_id: channelAccount,
            [type]: fileId || url,
            caption: source,
          },
          dataType: 'json',
        };

        if (withLikeButton) {
          requestObj.data.reply_markup = inlineKeyboardMarkup;
        }

        return ctx.curl(methodUrls[type], requestObj)
          .then(response => response.data);
      });

      return results;
    }

    * sendMediaByStreams({ resources = [], withLikeButton = false } = {}) {
      const { ctx } = this;

      if (!Array.isArray(resources) || !resources.length) {
        return [];
      }

      const results = yield resources.map(({ type, stream, fileName, source }) => {
        const form = new FormStream();

        form.field('chat_id', channelAccount);
        form.field('caption', source);

        if (withLikeButton) {
          form.field('reply_markup', inlineKeyboardMarkup);
        }

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
      const { ctx: { app: { memStore } } } = this;

      // you should fill in channelAccount to send message
      if (!channelAccount) {
        return [];
      }

      if (!Array.isArray(resources) || !resources.length) {
        return [];
      }

      const [ pendingStreams, pendingUrls ] = _.partition(resources, resource => !!resource.stream);

      const results = [
        ...yield this.sendMediaByStreams({ resources: pendingStreams, withLikeButton: true }),
        ...yield this.sendMediaByUrls({ resources: pendingUrls, withLikeButton: true }),
      ];

      for (const result of results) {
        const { ok } = result;

        if (!ok) {
          continue;
        }

        const { result: { message_id: messageId, chat: { id: chatId } } } = result;

        const memPath = `messages.chat_${chatId}.msg_${messageId}`;
        let messageData = memStore.get(memPath);

        if (!messageData) {
          messageData = { likes: 0, likeUsers: [] };
          yield memStore.set(memPath, messageData);
        }
      }

      return results;
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
