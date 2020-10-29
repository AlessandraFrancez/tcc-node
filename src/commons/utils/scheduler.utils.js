'use strict';

class SchedulerUtils {
  constructor() {
    this.Tweets = require('../../models/tweets.model');
    this.Dictionary = require('../../models/dictionaries.model');
    this.logger = require('../logger/logger');
  }

  async getUntranslatedWords() {
    const tweets = await this.Tweets.find({ checked: false, 'voting.selected.0': { $exists: true, $not: { $size: 0 } } });
    let counter = 0;

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];

      const { selected } = tweet.voting;
      console.log(selected);
      const list = [];
      selected.forEach(vote => {
        vote.forEach(word => {
          if (list.indexOf(word) === -1) {
            list.push(word);
          }
        });
      });

      for (let i = 0; i < list.length; i++) {
        const word = list[i];
        const knownWord = await this.Dictionary.countDocuments({ word }).lean();
        if (!knownWord) {
          await this.Dictionary.create({
            word,
            type: 'untranslated'
          });
          counter += 1;
        }
      }

      tweet.checked = true;
      await tweet.save();
    }

    this.logger.info(`[GetUntranslatedJob] ${counter} words added out of ${tweets.length} analyzed.`);
  }
}

module.exports = new SchedulerUtils();
