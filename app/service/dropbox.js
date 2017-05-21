'use strict';

module.exports = app => {
  class DropboxService extends app.Service {
    * uploadMediaByUrls({ type, resources = [] } = {}) {
      if (!type) {
        throw new Error('You must specify a type to upload media');
      }

      if (!resources || !Array.isArray(resources)) {
        throw new Error('Resources must be an array');
      }

      const { dropboxClient, config: { dropboxSavePath } } = app;

      try {
        yield resources.map(resource => dropboxClient.filesSaveUrl({
          path: `${dropboxSavePath}/${type}/${resource.fileName}`,
          url: resource.url,
        }));
      } catch (e) {
        throw e;
      }

      return true;
    }

    * uploadMediaByStreams({ type, resources = [] } = {}) {
      const { dropboxClient, config: { dropboxSavePath } } = app;
      const uploadStreams = resources.map(resource => {
        return resource.stream.pipe(
          dropboxClient.createUploadStream({
            path: `${dropboxSavePath}/${type}/${resource.fileName}`,
          })
          // .on('progress', res => console.log(res))
          .on('error', err => { throw err; })
        );
      });

      return uploadStreams;
    }
  }

  return DropboxService;
};
