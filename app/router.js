'use strict';

module.exports = app => {
  const { config: { botToken } } = app;

  app.get('/', 'home.index');
  app.post('message', `/endpoint/${botToken}/message`, 'endpoint.message');
};
