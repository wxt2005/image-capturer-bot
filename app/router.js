'use strict';

module.exports = app => {
  const { config: { botToken } } = app;

  app.post('message', `/endpoint/${botToken}/message`, 'endpoint.message');
};
