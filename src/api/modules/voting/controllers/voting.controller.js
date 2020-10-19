'use strict';

class VotingController {
  constructor() {
    this.tweets = require('../../../../models/tweets.model');
    this.getQuestions = this.getQuestions.bind(this);
  }

  async getQuestions(req, res, next) {
    const logger = require('../../../../commons/logger/logger');
    logger.info('GET /questions received');

    const list = await this.tweets.find({ status: 'tone' }).sort({ 'voting.fetched': 0 }).limit(10).lean();
    console.log(list);
    const filteredList = [];
    list.map(item => {
      filteredList.push({
        text: item.text,
        watsonTranslation: item.watsonTranslation
      });
    });

    // res.status(200);
    res.json(filteredList);
  }
}

module.exports = new VotingController();
