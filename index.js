'use strict';

const EnvLoader = require('./src/commons/env_loader');
const express = require('express');

class App {
  constructor() {
    this.loadEnv = new EnvLoader(`${__dirname}/src/env`);
    this.httpPort = process.env.HTTP_PORT;
    this.reqTimeout = process.env.reqTimeout || 2 * 60 * 1000;
    this.express = express();
    this.cookies = require('cookie-parser');
    this.path = require('path');
    this.helmet = require('helmet');
    this.mongoose = require('mongoose');
    this.logger = require('./src/commons/logger/logger');
    this.errorHandler = require('./src/commons/handler/error.handler');
    this.socketServer = require('./src/commons/factories/socket.factory');
    this.jwtMiddleware = require('./src/commons/middleware/jwt.middleware');
    this.connectionController = require('./src/commons/db/connection.controller');
    this.seedFactory = require('./src/commons/factories/seed.factory');
    this.cors = require('cors');
    this.middlewares();
    this.routes();
    // this.scheduler();
    this.initialize();
    this.seedFactory.initialize();
    this.mailer = require('./src/mailer/mailer');
  }

  middlewares() {
    const corsOptionsDelegate = function (req, callback) {
      let whitelist = [process.env.DOMAIN_INTERNET,
        'http://localhost:3000',
        'http://localhost:8081',
        undefined];
      let corsOptions = {
        credentials: true,
        origin: ''
      };
      if (req.path === '/app/api/loopback/test' || req.path === '/api/loopback/test') {
        corsOptions.origin = true;
        callback(null, corsOptions);
      }
      else {
        if (whitelist.indexOf(req.header('origin')) !== -1) {
          corsOptions.origin = true;
          callback(null, corsOptions);
        } else {
          console.log('Bloquear CORS*');
          corsOptions.origin = new Error('Not allowed by CORS');
          callback(new Error('Not allowed by CORS'));
        }
      }
    };

    this.express.use(this.cors(corsOptionsDelegate));
    this.express.use(this.cookies());
    this.express.use(this.helmet.xssFilter());
    this.express.use(this.helmet.contentSecurityPolicy({
      directives: {
        // eslint-disable-next-line quotes
        defaultSrc: ["'self'"],
        // eslint-disable-next-line quotes
        styleSrc: ["'self'"]
      }
    }));
    this.express.use(express.json({ limit: '30mb' }));
    this.express.use(this.jwtMiddleware.initialize());
    this.express.use(this.helmet({ frameguard: { action: 'deny' }, hsts: { maxAge: 5184000 } }));

    this.server = this.socketServer.initialize(this.express);
    this.server.setTimeout(this.reqTimeout);
  }

  routes() {
    const Routes = require('./src/api/routes');
    Routes.initialize(this.express);
    this.express.use('*', this.errorHandler);
  }

  // scheduler() {
  //   if (process.env.NODE_ENV !== 'testing'){
  //     const Scheduler = require('./src/commons/scheduler/scheduler.controller');
  //     Scheduler.initialize();
  //   }
  // }

  async initialize() {
    try {
      process.env.NODE_ENV = 'development';
      this.logger.info('Starting API server');
      await this.connectionController.connect();
      this.server.listen(this.httpPort);
      this.logger.info('APP has started | port:', this.httpPort);
    } catch (err) {
      err.type = 'code';
      this.logger.error('[API] Error starting application', err);
    }
  }
}

module.exports = new App();
