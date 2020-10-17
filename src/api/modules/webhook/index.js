'use strict';

const BaseRouter = require('../../../commons/router/base.router');

class UserRouter extends BaseRouter {
  constructor() {
    super();
    this.controller = require('./controllers/webhook.controller');
  }
  initialize() {
    this.get('/', this.controller.webhookLogger);
  }
}

module.exports = new UserRouter().getRouter();
