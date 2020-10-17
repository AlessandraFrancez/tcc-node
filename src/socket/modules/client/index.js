'use strict';

module.exports = {
  disabled: false,
  app() {
    return {
      SocketClientEvent: require('./events/client.event')
    };
  }
};
