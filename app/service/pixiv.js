'use strict';

// const co = require('co');
const urlUtils = require('url');

const fetchUgoiraVideoEndpoint = 'http://ugoira.dataprocessingclub.org/convert';
const fetchUgoiraDefaultParams = {
  format: 'webm',
  url: '',
};

const fetchIllustDetailEndpoint = 'https://app-api.pixiv.net/v1/illust/detail';
const fetchIllustDetailDefaultParams = {
  filter: 'for_ios',
  illust_id: '',
};
const headersForFetchIllustDetail = {
  'App-OS': 'ios',
  'App-OS-Version': '9.3.3',
  'App-Version': '6.1.2',
  'User-Agent': 'PixivIOSApp/6.1.2 (iOS 9.0; iPhone8,2)',
};
const headersForFetchImage = {
  Referer: 'https://www.pixiv.net/',
};
const FILE_NAME_REGEXP = /.+\/(.+?\.\w+?)$/i;


module.exports = app => {
  class PixivService extends app.Service {
    extractPhoto(illustDetail) {
      let resources = [];

      if (illustDetail.page_count === 1) {
        const originalImageUrl = illustDetail.meta_single_page.original_image_url;
        const fileName = originalImageUrl.match(FILE_NAME_REGEXP)[1];
        resources.push({
          fileName,
          url: originalImageUrl,
          type: 'photo',
        });
      } else {
        const tempResources = illustDetail.meta_pages.map(page => {
          const originalImageUrl = page.image_urls.original;
          const fileName = originalImageUrl.match(FILE_NAME_REGEXP)[1];

          return {
            fileName,
            url: originalImageUrl,
            type: 'photo',
          };
        });

        resources = [ ...resources, ...tempResources ];
      }

      return resources;
    }

    * extractUgoira(pageUrl, illustDetail) {
      const { ctx } = this;
      const resources = [];

      let videoUrl = '';
      try {
        videoUrl = yield ctx.curl(fetchUgoiraVideoEndpoint, {
          data: Object.assign({}, fetchUgoiraDefaultParams, { url: pageUrl }),
        }).then(response => JSON.parse(response.data.toString()).url);
      } catch (e) {
        throw new Error(`fecth ugoira video failed, id: ${illustDetail.id}`);
      }

      if (videoUrl) {
        resources.push({
          fileName: videoUrl.match(FILE_NAME_REGEXP)[1],
          url: videoUrl,
          type: 'video',
        });
      }

      return resources;
    }

    * extractMedia(pageUrl) {
      const { ctx } = this;
      const urlObject = urlUtils.parse(pageUrl, true);
      const illustId = urlObject.query.illust_id;

      if (!illustId) {
        return [];
      }

      let illustDetail = null;

      try {
        illustDetail = yield ctx.curl(fetchIllustDetailEndpoint, {
          data: Object.assign({}, fetchIllustDetailDefaultParams, { illust_id: illustId }),
          headers: headersForFetchIllustDetail,
        }).then(response => JSON.parse(response.data.toString()).illust);

      } catch (e) {
        throw new Error(`fetch pixiv illust detail failed, id: ${illustId}`);
      }

      let resources = [];

      if (!illustDetail) {
        return resources;
      }

      switch (illustDetail.type) {
        // regular illustrations
        case 'illust':
          resources = [
            ...resources,
            ...this.extractPhoto(illustDetail),
          ];
          break;

        // pixiv animation
        case 'ugoira':
          resources = [
            ...resources,
            ...(yield this.extractUgoira(pageUrl, illustDetail)),
          ];
          break;

        default:
          // noop
      }

      for (const resource of resources) {
        const { url, type } = resource;
        // just download pixiv images
        if (type !== 'photo') {
          continue;
        }

        let imageResponse = null;

        try {
          imageResponse = yield ctx.curl(url, {
            headers: headersForFetchImage,
            streaming: true,
          });
        } catch (e) {
          continue;
        }

        if (imageResponse.status !== 200) {
          continue;
        }

        resource.stream = imageResponse.res;
      }

      return resources;
    }
  }

  return PixivService;
};
