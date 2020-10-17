'use strict';

class JwtSocketMiddleware {
  constructor() {
    this.jwt = require('jsonwebtoken');
    this.secret = process.env.JWT_SECRET;
    this.tokenExp = process.env.JWT_EXP;
    this.process = this.process.bind(this);
    this.SocketUtils = require('../utils/socket.utils');
  }

  process(socket, next) {

    let token = '';
    if(socket.handshake.headers.cookie){
      let cookie = socket.handshake.headers.cookie;
      token = this.SocketUtils.getToken(cookie);
    } else if (socket.handshake.query.token){
      token = socket.handshake.query.token;
    } else {      
      return next('Invalid cookie');
    }

    this.jwt.verify(token, this.secret, (err, decoded) => {
      if (err) {
        return next(err);
      }
    next();
    });
  }

  update(token) {
    const decoded = this.jwt.verify(token, this.secret);
    delete decoded.exp;
    return this.jwt.sign({ ...decoded }, this.secret, { expiresIn: this.tokenExp });
  }

  initialize() {
    return this.process;
  }
}

module.exports = new JwtSocketMiddleware();
