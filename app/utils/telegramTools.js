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

module.exports = {
  extractUrlsFromMessage,
  getMethodUrl,
};
