'use strict';

// had enabled by egg
// exports.static = true;
exports.proxyagent = {
  enable: true,
  package: 'egg-development-proxyagent',
};

exports.memcached = {
  enable: true,
  package: 'egg-memcached',
};
