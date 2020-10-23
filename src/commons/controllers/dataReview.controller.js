'use strict';

class DatReviewController {
  constructor() {
    this.logger = require('../logger/logger');
    this.tweets = require('../../models/tweets.model');
  }

  async getTweetsStatus() {

    const fetched = await this.tweets.countDocuments({ 'voting.fetched': { $gt: 0 } });
    const status = await this.tweets.aggregate(
      [
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]
    );

    const result = {};
    Object.keys(status).forEach(item => {
      result[status[item]._id] = status[item].count;
    });

    this.logger.info('Status', {
      fetched: fetched,
      ...result
    });

  }

  async generateLogs() {
    await this.getTweetsStatus();
  }

}

module.exports = new DatReviewController();
