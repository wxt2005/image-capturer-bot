'use strict';

const {
  transformPictureUrl,
  getIdFromPageurl,
} = require('../utils/pixivTools');

const MEDIUM_IMAGE_REGEXP = /src="(https:\/\/i\.pximg\.net\/c\/600x600\/img-master\/img\/.+master1200\.jpg)"/i;

module.exports = app => {
  class PixivService extends app.Service {
    * extractMedia(pageUrl) {
      const { ctx } = this;
      const id = getIdFromPageurl(pageUrl);

      const pageResponse = yield ctx.curl(pageUrl, {
        dataType: 'text',
        // http link redirect
        followRedirect: true,
      });

      if (!pageResponse.data) {
        throw new Error(`fetch pixiv page failed, id: ${id}`);
      }

      const regExec = MEDIUM_IMAGE_REGEXP.exec(pageResponse.data);

      if (!regExec || regExec.length < 2) {
        throw new Error(`get medium image url from html failed, id: ${id}`);
      }

      const mediumUrl = regExec[1];
      const originalUrl = transformPictureUrl(mediumUrl);

      const imageResponse = yield ctx.curl(originalUrl, {
        headers: {
          Referer: 'https://www.pixiv.net/',
        },
        streaming: true,
      });

      return [{
        fileName: `${id}.png`,
        stream: imageResponse.res,
        url: originalUrl,
      }];
    }
  }

  return PixivService;
};
