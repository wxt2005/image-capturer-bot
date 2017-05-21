'use strict';

// const co = require('co');
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

      const result = [];
      const possibleFileExtensions = [ '.jpg', '.png' ];

      // have not yet figured out how to detect real image extension without login, try both
      for (const extension of possibleFileExtensions) {
        try {
          const imageResponse = yield ctx.curl(`${originalUrl}${extension}`, {
            headers: {
              Referer: 'https://www.pixiv.net/',
            },
            streaming: true,
          });

          if (imageResponse.status === 200) {
            result.push({
              fileName: `${id}${extension}`,
              stream: imageResponse.res,
              url: `${originalUrl}${extension}`,
            });

            break;
          }
        } catch (e) {
          // slient failure
          ctx.logger.error(e);
        }
      }

      return result;
    }
  }

  return PixivService;
};
