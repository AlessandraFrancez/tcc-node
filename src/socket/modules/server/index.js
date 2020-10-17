'use strict';

module.exports = {
  disabled: false,
  app() {
    return {
      SocketServerEvent: require('./events/server.event')
    };
  }
};
