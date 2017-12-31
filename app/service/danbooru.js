'use strict';

const urlUtils = require('url');
const debug = require('debug')('bot:danbooru');

const POST_REGEXP = /^\/posts\/(\d+)$/i;

module.exports = app => {
  class DanbooruService extends app.Service {
    * extractMedia(sourceUrl) {
      const { danbooruClient } = app;
      const parsedUrl = urlUtils.parse(sourceUrl);
      const matched = POST_REGEXP.exec(parsedUrl.pathname);
      if (!matched) {
        return [];
      }

      const postId = matched[1];
      let post = {};
      try {
        post = yield danbooruClient.getPost(postId);
        debug('Received post %O', post);
      } catch (e) {
        debug('Fetch danbooru post failed: %O', e);
        return [];
      }

      return [{
        fileName: `${post.id}.${post.file_ext}`,
        url: post.large_file_url,
        type: 'photo',
        source: sourceUrl,
      }];
    }
  }

  return DanbooruService;
};
