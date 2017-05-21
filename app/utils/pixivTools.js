'use strict';

const MEDIUM_IMAGE_REGEXP = /^.+?(\/img\/.+)_master1200\..+$/i;
const PAGE_URL_REGEXP = /https?:\/\/www\.pixiv\.net\/member_illust\.php\?mode=medium&illust_id=(\d+)/i;

/**
 * Transform medium size image url to original size image url
 * @param  {String} mediumUrl medium size image url
 * @return {String}           original size image url
 */
const transformPictureUrl = mediumUrl => mediumUrl.replace(MEDIUM_IMAGE_REGEXP, (match, p1) => `https://i.pximg.net/img-original${p1}.png`);

/**
 * Get id from page url
 * @param  {String} pageUrl illustration page url
 * @return {String}         illustration id
 */
const getIdFromPageurl = pageUrl => pageUrl.match(PAGE_URL_REGEXP)[1];

module.exports = {
  transformPictureUrl,
  getIdFromPageurl,
};
