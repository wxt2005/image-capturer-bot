'use strict';

const _ = require('lodash');

module.exports = app => {
  class DropboxService extends app.Service {
    * uploadMediaByUrls({ type, resources = [] } = {}) {
      const { dropboxClient, config: { dropboxSavePath } } = app;

      return yield resources.map(resource => dropboxClient.filesSaveUrl({
        path: `${dropboxSavePath}/${type}/${resource.fileName}`,
        url: resource.url,
      }));
    }

    * uploadMediaByStreams({ type, resources = [] } = {}) {
      const { dropboxClient, config: { dropboxSavePath } } = app;

      return resources.map(resource => {
        return resource.stream.pipe(
          dropboxClient.createUploadStream({
            path: `${dropboxSavePath}/${type}/${resource.fileName}`,
          })
          // .on('progress', res => console.log(res))
          .on('error', err => { throw err; })
        );
      });
    }

    * uploadMedia({ type, resources = [] } = {}) {
      if (!type) {
        throw new Error('You must specify a type to upload media');
      }

      if (!resources || !Array.isArray(resources)) {
        throw new Error('Resources must be an array');
      }

      const [ pendingStreams, pendingUrls ] = _.partition(resources, resource => !!resource.stream);

      return yield [
        ...this.uploadMediaByStreams({ type, resources: pendingStreams }),
        ...this.uploadMediaByUrls({ type, resources: pendingUrls }),
      ];
    }
  }

  return DropboxService;
};
