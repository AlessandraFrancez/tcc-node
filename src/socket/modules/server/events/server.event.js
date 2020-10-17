'use strict';
const Socket = require('../../../../commons/factorys/socket.factory');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const jwt = require('jsonwebtoken');
class SocketServerEvent {
  constructor() {
    this.logger = require('../../../../commons/logger/logger');
    this.PropertyUtils = require('../../../../commons/utils/property.utils');
    this.InputMessageUtils = require('../../../../commons/utils/inputmessage.utils');
    this.SocketConstants = require('../../../../commons/constants/socket.constants');
    this.SocketUtils = require('../../../../commons/utils/socket.utils');
    this.EncryptUtils = require('../../../../commons/utils/encryption.utils');
    this.secret = process.env.JWT_SECRET;
    this.jwt = require('jsonwebtoken');
    this.io = Socket.io;
    this.roomName = '';
    this.express = require('express');

    this.rateLimiter = new RateLimiterMemory({
      points: 10,
      duration: 15
    });

    this.initialize();
  }

  init(client) {
    client.on(this.SocketConstants.INIT, async () => {
      let token = this.SocketUtils.handleToken(client);
      let jwtMessage = this.jwt.verify(token, this.secret);
      let { ID } = this.EncryptUtils.decryptMessage(jwtMessage.Payload);

      try {
        await this.rateLimiter.consume(client.handshake.address);
      } catch (rejRes) {
        // On flood
        this.logger.warn(`[API] User ${client.handshake.address} has sent too many messages in a short time.`);
        await this.io.to(ID).emit(this.SocketConstants.FLOOD, { time: 5000 });
      }

      const data = {
        Token: token,
        ClientId: ID,
        ID: ID
      };

      let status = await this.SocketUtils.getChatStatus(ID);
      if (status) {
        await this.InputMessageUtils.sendMessage(data);
      }
    });
  }

  send(client) {
    client.on(this.SocketConstants.SEND, async (data, callback) => {
      let token = this.SocketUtils.handleToken(client);
      let jwtMessage = '';
      try {
        jwtMessage = this.jwt.verify(token, this.secret);
      }
      catch (err) {
        console.log('err expired', err);
        if (err.name === 'TokenExpiredError') {
          const jwtMessage = jwt.verify(token, this.secret, { ignoreExpiration: true });
          let { ID } = this.EncryptUtils.decryptMessage(jwtMessage.Payload);
          this.io.to(ID).emit(this.SocketConstants.EXPIRED);
          return;
        }
      }
      let { ID } = this.EncryptUtils.decryptMessage(jwtMessage.Payload);
      try {
        await this.rateLimiter.consume(client.handshake.address);
        data.Token = token;
        data.ClientId = ID;
        data.ID = ID;
        this.PropertyUtils.setValue(data, 'Time.Front.End', this.PropertyUtils.getTimeStamp());
        if (typeof callback === 'function') callback('pong');
        await this.InputMessageUtils.sendMessage(data);
      } catch (rejRes) { // On flood
        this.logger.verbose('[Server Event] Send exception: ', rejRes);
        this.io.to(ID).emit(this.SocketConstants.FLOOD, { time: 5000, data });
      }
    });
  }

  response(client) {
    client.on(this.SocketConstants.SEND_TO, async (data) => {
      console.log('\n Resposta do Worker \n', data.ID, data.Response);

      this.io.to(data.ID).emit(this.SocketConstants.RESPONSE, data);
    });
  }

  disconnect(client) {
    client.on(this.SocketConstants.DISCONNECTION, (reason) => {
      try {
        console.log('Client desconectou', client.id);
        let token = this.SocketUtils.handleToken(client);
        let jwtMessage = this.jwt.verify(token, this.secret);
        let { ID } = this.EncryptUtils.decryptMessage(jwtMessage.Payload);
        client.leave(ID);
        this.ChatController.setInactive(client.id);
      } catch (err) {
        console.log('[Server Event] Disconnect event received:', err);
      }
    });
  }

  updateConnect(client) { // ??
    client.on(this.SocketConstants.UPDATE_CONNECT, async () => {
      let token = this.SocketUtils.handleToken(client);
      let jwtMessage = this.jwt.verify(token, this.secret);
      let { ID } = this.EncryptUtils.decryptMessage(jwtMessage.Payload);
      const Chat = await this.Chat.findOne({ ID });
      if (Chat) {
        client.join(ID);
        Chat.ClientId = client.id;
        await Chat.save();
      }
    });
  }

  reconnect(client) {
    client.on('sendRe', (data) => {
      console.log('Recebi evento de reconnect do front');
      console.log('\nDATA DO FRONT: ', data);
      let token = this.SocketUtils.handleToken(client);
      let jwtMessage = this.jwt.verify(token, this.secret);
      let { ID } = this.EncryptUtils.decryptMessage(jwtMessage.Payload);
      this.io.to(ID).emit('reconnect', data);
    });
  }

  initialize() {
    this.io.on(this.SocketConstants.CONNECTION, async (client) => {
      this.client = client;

      let token = this.SocketUtils.handleToken(client);
      let jwtMessage = this.jwt.verify(token, this.secret);
      let Auth = this.EncryptUtils.decryptMessage(jwtMessage.Payload);

      console.log('Auth', Auth);

      if (Auth.Type) { // Worker
        console.log('Worker');
      } else {
        client.join(Auth.ID);
        try {
          await this.rateLimiter.consume(client.handshake.query.token);
        } catch (rejRes) {
          // On flood
          await this.io.to(Auth.ID).emit(this.SocketConstants.FLOOD, { time: 5000 });
          client.error('Too many requests');
          client.disconnect(true);
          return { message: 'Too many requests' };
        }
      }

      this.init(client);
      this.reconnect(client);
      this.send(client);
      this.response(client);
      this.disconnect(client);
      this.updateConnect(client);
    });
  }
}

module.exports = new SocketServerEvent();
