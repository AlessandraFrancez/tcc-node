'use strict';

class SanitizationController {
  constructor() {
    this.logger = require('../logger/logger');
    this.tweets = require('../../models/tweets.model');
    this.emoji = require('node-emoji');
    this.dictionary = require('../../models/dictionaries.model');
  }

  _removeEmoji(text) {
    return this.emoji.unemojify(text);
  }

  async _handleRepeatedChar(text) {
    const handleRepeated = async (word) => {
      const knownWord = await this.dictionary.findOne({ word, type: 'repeated' }).lean();
      if (knownWord) {
        if (knownWord.replacement) {
          return knownWord.replacement;
        } else {
          this.logger.info('[HandleRepeatedWord] Manual intervention required on repeated word', knownWord);
          return word;
        }
      } else {
        await this.dictionary.insertOne({ word, type: 'repeated' });
        return word;
      }
    };
    // eslint-disable-next-line no-useless-escape
    text.replace('\w*(\w)\\1{2,}\w*', handleRepeated);
  }

  async _handleAbbreviations(text) {
    const dict = await this.dictionary.find({ type: 'general' }).lean();
    for (let i = 0; i < dict.length; i++) {
      text.replace(dict[i].word, dict[i].replacement);
    }
  }

  handleText(status) {
    const tweets = this.tweets.find({ status });

    this.logger.info(`[Data Analysis] ${tweets.length} being processed from 'raw' state.`);
    tweets.forEach(async tweet => {
      tweet.text = this._removeEmoji(tweet.text);
      tweet.text = tweet.text.replace('_', ' ').replace(':', ' ');
      tweet.text = tweet.text.replace(/[^\w\s]/gi, '');
      tweet.text = await this._handleRepeatedChar(tweet.text);
      tweet.text = await this._handleAbbreviations(tweet.text);
    });
  }
}

module.exports = new SanitizationController();
