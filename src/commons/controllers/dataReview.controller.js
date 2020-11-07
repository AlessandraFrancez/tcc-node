'use strict';

const { count } = require('../../models/timers.model');

class DataReviewController {
  constructor() {
    this.logger = require('../logger/logger');
    this.tweets = require('../../models/tweets.model');
    this.configurations = require('../../models/config.model');
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

  /** Gets intents from 2 sources:
 * - Intents identified by Watson Assistant
 * - Intents voted by users on the form (question 3)
 * Only the top 2 intents are considered
 */
  async getIntents(limit = 100) {
    const tweets = await this.tweets.find(
      {
        'intents': { $exists: true },
        'intents.0': { $exists: true }
      },
      {
        _id: 0,
        intents: 1,
        'voting.intents': 1,
        'originalText': 1
      }).limit(limit).lean();

    tweets.forEach(tweet => {
      const mainIntent = tweet.intents[0];

      if (tweet.voting && tweet.voting.length > 0) {
        tweet.voting.forEach(vote => {
          this.logger.info('[Data Review] [Intents]', {
            originalText: tweet.originalText,
            userIntent: vote.intent,
            intent: mainIntent,
            confidence: mainIntent.confidence
          });
        });
      } else {
        this.logger.info('[Data Review] [Intents]', {
          originalText: tweet.originalText,
          intent: mainIntent.intent,
          confidence: mainIntent.confidence
        });
      }
    });
  }

  _findMeaning(type, mainTone, alternateTone = '') {
    const tonesMeaning = [
      { name: 'Joy', meaning: 'happy' },
      { name: 'Anger', meaning: 'unhappy' },
      { name: 'Sadness', meaning: 'unhappy' },
      { name: 'Fear', meaning: 'unhappy' }
    ];

    const themesMeaning = [
      { name: 'Elogio', meaning: 'happy' },
      { name: 'Outro', meaning: 'other' }
    ];

    if (type === 'watson') {
      const match = tonesMeaning.find(tone => tone.name === mainTone || tone.name === alternateTone);
      console.log('match', match);
      return match ? match.meaning : 'other';
    } else {
      const match = themesMeaning.find(tone => tone.name === mainTone || tone.name === alternateTone);
      return match ? match.meaning : 'other';
    }
  }

  /**
   * Gets tones from 2 sources:
   * - Tones identified by Watson Tone Analyser
   * - Responses from users from the form (question 3)
   * Classifies tones into "happy", "unhappy" and "other"
   */
  async getTones(limit = 100) {
    const tweets = await this.tweets.find(
      {
        'tones': { $exists: true },
        'tones.0': { $exists: true }
      },
      {
        _id: 0,
        tones: 1,
        'voting': 1,
        'originalText': 1
      }).limit(limit).lean();

    tweets.forEach(tweet => {
      tweet.tones.sort((a, b) => a.score - b.score);
      const toneAnalysis = {
        originalText: tweet.originalText,
        mainTone: tweet.tones[0].tone_name,
        mainScore: tweet.tones[0].score,
        watsonSentiment: this._findMeaning('watson', tweet.tones[0].tone_name, tweet.tones[0].tone_name ? tweet.tones[0].tone_name : '')
      };

      if (tweet.tones.length > 1) {
        toneAnalysis.secondaryTone = tweet.tones[1].tone_name;
        toneAnalysis.secondaryScore = tweet.tones[1].score;
      }

      if (tweet.voting && tweet.voting.fetched > 0) {
        if (tweet.voting.fetched === 1) { // Only one answer
          toneAnalysis.userSentiment = this._findMeaning('user', tweet.voting.theme[0]);
        } else { // Multiple answers
          // voting: {theme: ['aaaaa', 'bbbb', 'aaa']}

          const votes = tweet.voting.theme;
          const counts = {};

          votes.forEach(vote => {
            !counts[vote] ? counts[vote] = 1 : counts[vote] += 1;
          });

          const mostVotedTheme = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
          toneAnalysis.userTone = mostVotedTheme;
          toneAnalysis.certainty = counts[mostVotedTheme] / votes.length;
          toneAnalysis.userSentiment = this._findMeaning('user', mostVotedTheme);
        }
      }

      this.logger.info('[Data Review] [Tone]', toneAnalysis);
    });
  }

  /** Gets entities from 3 sources:
   * - Responses from users in the form (question 4)
   * - Query used to fetch the tweet
   * - Entity identified by Watson Assistant
   */
  async getEntities(limit = 100) {

    const config = await this.configurations.find({}, { _id: 0, query: 1, company: 1, exclude: 1 }).lean();

    config.map(item => {
      if (item.exclude && item.exclude.length > 0) {
        item.query += ' -"' + item.exclude[0] + '"';
      }
      return item;
    });

    const tweets = await this.tweets.find({ status: 'tone' },
      {
        _id: 0,
        originalText: 1,
        query: 1,
        watsonEntities: 1,
        voting: 1
      }).limit(limit).lean();

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];

      const entityAnalysis = {
        originalText: tweet.originalText
      };

      // Entities based on the query used to fetch the tweet
      const company = config.find(item => item.query === tweet.query);
      entityAnalysis.query = company ? company[0].company : tweet.query;

      // Entities informed by users
      if (tweet.voting && tweet.voting.fetched > 0) {
        if (tweet.voting.fetched === 1) { // Only one answer
          entityAnalysis.userCompany = tweet.voting.company[0];
        } else { // Multiple answers
          const votes = tweet.voting.company;
          const counts = {};

          votes.forEach(vote => {
            !counts[vote] ? counts[vote] = 1 : counts[vote] += 1;
          });

          const mostVoted = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
          entityAnalysis.userCompany = mostVoted;
          entityAnalysis.certainty = counts[mostVoted] / votes.length;
        }
      }

      // Entities identified by Watson Assistant
      if (tweet.watsonEntities && tweet.watsonEntities.length > 0) {
        entityAnalysis.watsonEntities = tweet.watsonEntities[0].entity;
        entityAnalysis.watsonConfidence = tweet.watsonEntities[0].confidence;
      } else {
        entityAnalysis.watsonEntity = '';
      }

    }

  }

  async generateLogs() {
    await this.getTweetsStatus();
    // await this.getIntents(100);
    // await this.getTones(100);
    // await this.getEntities(100);
  }

}

module.exports = new DataReviewController();
