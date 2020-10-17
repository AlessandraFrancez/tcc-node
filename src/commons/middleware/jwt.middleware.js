'use strict';

const HttpController = require('../controllers/http.controller');

class JwtMiddleware extends HttpController {
  constructor() {
    super();
    this.secret = process.env.JWT_SECRET;
    this.jwt = require('jsonwebtoken');
    this.process = this.process.bind(this);
  }

  _getTokenFromHeader(req) {
    const { authorization } = req.headers;
    return authorization ? authorization.split(/(\s+)/)[2] : '';
  }

  async process(req, res, next) {
    const { originalUrl } = req;
    let token;
    try {
      if (
        originalUrl.indexOf('/api/loopback') > -1 ||
        originalUrl.indexOf('files') > -1 ||
        originalUrl.indexOf('/') > -1
      ) {
        next();
      } else {
        token = this._getTokenFromHeader(req);
        req.token = await this.jwt.verify(token, this.secret);
        next();
      }
    } catch (err) {
      next(new this.HttpError(this.messages.TOKEN_EXPIRED, this.WatsonConstants.CODE_INVALID_REQUEST, { token, error: err.message }));
    }
  }

  initialize() {
    return this.process;
  }
}

module.exports = new JwtMiddleware();
