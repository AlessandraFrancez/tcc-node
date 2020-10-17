'use strict';

const HttpController = require('../../../../commons/controllers/http.controller');

class UserController extends HttpController {
  constructor() {
    super();
    this.logger = require('../../../../commons/logger/logger');
  }

  webhookLogger(req, res, next){
    const { body, query } = req;
    this.logger.info('Webhook event received:', body);
    this.logger.info('Webhook query:', query);
    this._sendResponse(res, next);
  }

}

module.exports = new UserController();
