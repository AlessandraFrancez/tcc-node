'use strict';

class GoogleController {
  constructor() {
    this.axios = require('axios');
    this.logger = require('../logger/logger');
    this.tweets = require('../../models/tweets.model');
  }

  /** @description Calls Google Translate and returns string of translated text */
  async googleTranslate(text) {
    try {
      const res = await this.axios({
        method: 'post',
        url: 'https://translation.googleapis.com/language/translate/v2',
        headers: { 'content-type': 'application/json' },
        data: {
          q: text,
          source: 'pt',
          target: 'en',
          format: 'text'
        }
      });

      this.logger.info('Google Translation: ', res.data);

      if (res.data.data && res.data.data.translations && res.data.data.translations.length > 0) {
        return res.data.data.translations[0].translatedText;
      } else {
        return '';
      }
    } catch (err) {
      this.logger.error('[Google Translation] Error occurred:', err);
      return '';
    }
  }
}

module.exports = new GoogleController();
