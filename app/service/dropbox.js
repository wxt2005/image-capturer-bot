'use strict';

module.exports = app => {
  class DropboxService extends app.Service {
    * uploadMedia({ type, media } = {}) {
      if (!type) {
        throw new Error('You must specify a type to upload media');
      }

      if (!media || !Array.isArray(media)) {
        throw new Error('media must be an array');
      }

      const { dropboxClient, config: { dropboxSavePath } } = app;

      let fileNameRegexp = /.+/;

      switch (type) {
        case 'twitter':
          fileNameRegexp = /media\/(.+)$/;
          break;

        default:
          // noop
      }

      try {
        yield media.map(url => dropboxClient.filesSaveUrl({
          path: `${dropboxSavePath}/${type}/${fileNameRegexp.exec(url)[1]}`,
          url,
        }));
      } catch (e) {
        throw e;
      }

      return true;
    }
  }

  return DropboxService;
};
