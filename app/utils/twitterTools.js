'use strict';

const _ = require('lodash');

/** @type {String} mp4 content type */
const MP4_CONTENT_TYPE = 'video/mp4';

/**
 * Extract filename from url
 * @param  {Regexp} fileNameRegexp regexp to determind filename
 * @param  {Stirng} url            original resouce url
 * @return {String}                filename
 */
const extractFileNameFromUrl = (fileNameRegexp, url) => {
  if (!_.isRegExp(fileNameRegexp)) {
    throw new TypeError('fileNameRegexp must be a Regexp');
  }

  if (!url) {
    throw new Error('url must be provided');
  }

  const regexpExecuteResult = fileNameRegexp.exec(url);
  let fileName = '';

  if (!regexpExecuteResult || regexpExecuteResult.length < 2) {
    fileName = encodeURIComponent(url);
  } else {
    fileName = regexpExecuteResult[1];
  }

  return fileName;
};

/**
 * Extract resource from regular photo
 * @api private
 * @param  {Object} mediaObject object from media array
 * @return {Object}             resource object
 */
const extractPhoto = mediaObject => {
  const fileNameRegexp = /media\/(.+)$/;
  const url = mediaObject.media_url_https;
  const fileName = extractFileNameFromUrl(fileNameRegexp, url);

  return {
    url,
    fileName,
  };
};

/**
 * Extract resource from animated gif
 * @api private
 * @param  {Object} mediaObject object from media array
 * @return {Object}             resource object
 */
const extractAnimatedGif = mediaObject => {
  const fileNameRegexp = /tweet_video\/(.+)$/;
  const { video_info: { variants } } = mediaObject;
  const url = _.chain(variants)
                    .filter(item => item.content_type === MP4_CONTENT_TYPE)
                    .head()
                    .get('url')
                    .value();
  const fileName = extractFileNameFromUrl(fileNameRegexp, url);

  return {
    url,
    fileName,
  };
};

/** @type {Object} A map to hold extract methods */
const extractors = {
  photo: extractPhoto,
  animated_gif: extractAnimatedGif,
};

/**
 * Extract resources from media array
 * @api public
 * @param  {Array} mediaArray an array of media items
 * @return {Array}            an array of media resource object
 */
const extractMedia = mediaArray => {
  if (!mediaArray || !Array.isArray(mediaArray) || !mediaArray.length) {
    return [];
  }

  const resources = _.chain(mediaArray)
                .map(mediaObject => extractors[mediaObject.type](mediaObject))
                .filter(url => !!url)
                .uniq()
                .value();

  return resources;
};

module.exports = {
  extractMedia,
};
