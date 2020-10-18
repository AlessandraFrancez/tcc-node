'use strict';

const pkg = require('../../../../package.json');
const logger = require('../../../commons/logger/logger');
const BaseRouter = require('../../../commons/router/base.router');
const connectionController = require('../../../commons/db/connection.controller');

class LoopbackRouter extends BaseRouter {
  initialize() {
    this.get('/version', (req, res) => res.json({ version: pkg.version }));
    this.get('/test', async (req, res) => {
      logger.info('Healthcheck requested...');
      const data = await this.healthCheck();
      logger.info('Healthcheck data:', data);
      if (req.query && req.query.formatted) {
        // res.writeHead(200,{"Content-Type" : "text/html"});
        // res.write(`<h1>WIP</h1>`);
        // res.end();
        res.write(JSON.stringify(data, null, 2));
      } else {
        // res.json(data);
        res.write(JSON.stringify(data, null, 2));
        res.end();
      }
    });
    this.get('/delay/:secs', async (req, res) => {
      const delay = secs => {
        return new Promise(resolve => setTimeout(() => resolve({ delay: secs }), secs * 1000));
      };
      const result = await delay(req.params.secs);
      res.json(result);
    });
  }

  async healthCheck() {
    return {
      mongo: connectionController.hasConnection()
    };
  }
}

module.exports = new LoopbackRouter().getRouter();
