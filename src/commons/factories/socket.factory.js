'use strict';
const http = require('http');
const { RateLimiter } = require('limiter');

class SocketFactory {
  constructor() {
    this.io;
    this.ioredis = require('ioredis');
    this.logger = require('../logger/logger');
    this.redis = require('socket.io-redis');
    this.redisClient = require('redis');
    this.helmet = require('helmet');
    this.socketServer = require('socket.io');
    this.socketClient = require('socket.io-client');
    this.cookies = require('cookie-parser');
    this.jwtSocket = require('../middleware/jwtSocket.middleware');
    this.redis_host = process.env.REDIS_HOST;
    this.redis_port = process.env.REDIS_PORT;
    this.redis_password = process.env.REDIS_PASS;
    this.socketClientUrl = process.env.SERVER_URL;
    this.redis_sentinel = process.env.REDIS_SENTINEL;
    // this.limiter = require('../middleware/rateLimiter.middleware')
    this.limiter = new RateLimiter(6, 500, true);
    this.allowRequest = this.allowRequest.bind(this);

  }

  middlewares() {
    this.io.use(this.jwtSocket.initialize());
  }

  checkBucket(err, remainingRequests) {
    if (remainingRequests < 1) {
      return false
    } else {
      return true
    }
  }

  allowRequest(req, callback) {
    const limit = this.limiter.removeTokens(1, this.checkBucket);
    callback(limit ? null : 'Too many requests', limit);
  }

  adapter() {
    this.io.adapter(this.redis({ host: this.redis_host, port: this.redis_port, password: this.redis_password }));
  }

  async hasConnection(port, host, pass = '') {

    try {
      const client = this.redisClient.createClient(port, host);
      if (pass) client.auth(pass);
      return new Promise((res, rej) => {
        client.on('connect', function () {
          client.quit();
          res(true);
        });
      });
    }
    catch (err) {
      return false;
    }
  }

  getClient(tokenOld) {
    const Client = this.socketClient.connect(`${this.socketClientUrl}`, {
      reconnect: true,
      query: { token: tokenOld }
    });
    // const Token = this.jwtSocket.update(tokenOld);
    return { Client, Token: tokenOld };
  }

  initialize(app) {
    if (app) {
      app.use(this.helmet.xssFilter());
      app.use(this.helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'"]
        }
      }));
      app.use(this.cookies());
      const server = http.createServer(app);

      this.io = this.socketServer(server,
        {
          cookie: false,
          transports: ['websocket', 'polling'],
          path: '/socket.io',
          serveClient: true,
          allowRequest: this.allowRequest
        });
      this.io.origins((origin, callback) => {
        if (origin !== "http://localhost:3000" && origin !== process.env.WORKER_CORS_URL && !origin.includes(process.env.DOMAIN_INTERNET)) {
          console.log('Bloqueado', origin)
          callback('Origin not allowed', false);
        }
        callback(null, true);
      });
      // this.adapter();
      this.middlewares();
      this.logger.info('[Socket] Starting Server Url');
      return server;
    } else {
      this.io = this.socketClient.connect(`${this.socketClientUrl}`, {
        reconnect: true
      });
      this.logger.info('[Socket] Starting Client Url ...', this.socketClientUrl);
    }
  }
}

module.exports = new SocketFactory();
