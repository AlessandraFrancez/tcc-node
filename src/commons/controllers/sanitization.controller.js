'use strict';

class SanitizationController {
  constructor() {
    this.logger = require('../logger/logger');
    this.tweets = require('../../models/tweets.model');
  }
}

module.exports = new SanitizationController();
