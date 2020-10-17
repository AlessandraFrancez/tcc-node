'use strict';
const Socket = require('../../../../commons/factorys/socket.factory');

class SocketClientEvent {
  constructor() {
    this.logger = require('../../../../commons/logger/logger');
    this.SocketConstants = require('../../../../commons/constants/socket.constants');
  }

  sendTo(ClientId, Params, Event = this.SocketConstants.SEND_TO) {
    const { Token: TokenOld, ...data } = Params;
    const { Client, Token } = Socket.getClient(TokenOld);
    data.Token = Token;
    Client.emit(Event, ClientId, data);
  }
}

module.exports = new SocketClientEvent();
