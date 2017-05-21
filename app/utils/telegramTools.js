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

module.exports = {
  extractUrlsFromMessage,
};
