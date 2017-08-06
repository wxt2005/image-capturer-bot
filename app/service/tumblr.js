'use strict';

const PHOTO_REGEXP = /src="(https?:\/\/\d+\.media\.tumblr\.com\/\w+\/)(tumblr_\w+_)(\d+)\.(jpe?g|gif|png|)"/gmi;

module.exports = app => {
  class TumblrService extends app.Service {
    extractPhoto(htmlString) {
      const resources = [];

      htmlString.replace(PHOTO_REGEXP, (match, p1, p2, p3, p4) => {
        resources.push({
          fileName: `${p2.slice(0, -1)}.${p4}`,
          url: `${p1}${p2}1280.${p4}`,
          type: p4 === 'gif' ? 'document' : 'photo',
        });
      });

      return resources;
    }

    * extractMedia(pageUrl) {
      const { ctx } = this;
      const result = yield ctx.curl(pageUrl, {
        timeout: [ 5000, 40000 ],
        dataType: 'text',
        followRedirect: true,
        gzip: true,
      });

      if (result.status === 200) {
        const resources = this.extractPhoto(result.data);
        return resources.map(resource => Object.assign({}, resource, {
          source: pageUrl,
        }));
      }

      return [];
    }
  }

  return TumblrService;
};
