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

    return text;
  }

  async _handleAbbreviations(text) {
    const dict = await this.dictionary.find({ type: 'general' }).lean();
    for (let i = 0; i < dict.length; i++) {
      text.replace(dict[i].word, dict[i].replacement);
    }
    return text;
  }

  async handleText(status) {
    const tweets = await this.tweets.find({ status });

    this.logger.info(`[Data Analysis] Analyzing ${tweets.length} tweets in status ${status}`);
    tweets.forEach(async tweet => {
      // console.log('Antes: ', tweet.text);
      tweet.originalText = tweet.text;
      tweet.text = this._removeEmoji(tweet.text);
      tweet.text = tweet.text.replace(/_/g, ' ').replace(/:/g, ' ');
      tweet.text = tweet.text.replace(/(\r\n|\n|\r|\t)/gm, ' ');
      tweet.text = await this._handleRepeatedChar(tweet.text);
      tweet.text = await this._handleAbbreviations(tweet.text);
      // console.log('Depois', tweet.text);
      tweet.status = 'sanitized';
      tweet.save();
    });
  }
}

module.exports = new SanitizationController();
