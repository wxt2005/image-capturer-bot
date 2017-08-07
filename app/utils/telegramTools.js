'use strict';

const _ = require('lodash');

/**
 * Extract urls from message entities
 * @param  {Object} message telegram message object
 * @return {Array}         array of urls
 */
const extractUrlsFromMessage = message => {
  const { entities, text } = message;

  if (!text || !Array.isArray(entities) || !entities.length) {
    return [];
  }

  const urls = _.chain(entities)
    .filter(entity => entity.type === 'url')
    .map(entity => text.slice(entity.offset, entity.offset + entity.length))
    .value();

  return urls;
};

/**
 * Get telegram api mehod url
 * @param  {String} token api token
 * @param  {String} methodName api method name
 * @return {String}            api url
 */
const getMethodUrl = (token, methodName) => `https://api.telegram.org/bot${token}/${methodName}`;

/**
 * Extract full size photo object from message
 * @param  {Object} message telegram message object
 * @return {Object}         photo object
 */
const extractFullSizePhotoObject = message => {
  const { photo } = message;

  if (!Array.isArray(photo) || !photo.length) {
    return null;
  }

  let result = null;
  let maxHeight = 0;
  let maxWidth = 0;

  photo.forEach(p => {
    const { width, height } = p;

    if (width > maxWidth) {
      maxWidth = width;
      result = p;
    } else if (height > maxHeight) {
      maxHeight = height;
      result = p;
    }
  });

  return result;
};

module.exports = {
  extractUrlsFromMessage,
  getMethodUrl,
  extractFullSizePhotoObject,
};
