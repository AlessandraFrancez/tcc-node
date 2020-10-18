'use strict';

const _ = require('lodash');

class Scheduler {
  constructor() {
    this.moment = require('moment');
    this.cron = require('node-cron');
    this.ConfigurationFactory = require('../factories/configuration.factory');
    this.logger = require('../logger/logger');
    // this.Mailer = require('../../mailer/mailer');
  }
  // WIP
  async initialize() {
    await this.ConfigurationFactory.initialize();
    this.updateConfiguration();
    this.runTweetsJob(false, false);
    this.runAnalysisJob(true, false);
  }

  async scheduleJob(cronParam, job) {
    const task = await this.cron.schedule(cronParam, job, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
    });
    return task;
  }

  async planJobs(frequency, job, frequencyType = 'hours') {
    const cronParam = this.PropertyUtils.getCronHour(frequency, frequencyType);
    this.logger.verbose(`[PlanJob] Job: ${job.name} set to ${cronParam}`);
    return this.scheduleJob(cronParam, job);
  }

  async cancelJobs(JobName) {
    this.schedule.cancelJob(JobName);
  }

  async runTweetsJob(enabled = true, scheduled = true) {
    if (enabled) {
      const twitterController = require('../controllers/twitter.controller');
      const TwitterJob = async () => {
        this.logger.info('[Scheduler] Starting Twitter Job');
        await twitterController.getTweetQueries();
        this.logger.info('[Scheduler] Twitter Job finished successfully.');
      };

      if (scheduled) {
        const { TWEET_EXTRACTION_FREQUENCY } = global.CONFIGURATION;
        await this.scheduleJob(TWEET_EXTRACTION_FREQUENCY, TwitterJob);
      } else {
        TwitterJob();
      }
    }
  }

  async runAnalysisJob(enabled = true, scheduled = true) {
    if (enabled) {
      const WatsonController = require('../controllers/ibmwatson.controller');
      const DataJob = async () => {
        this.logger.info('[Scheduler] Starting Data Analysis Job');
        await WatsonController.runDataAnalysis();
        this.logger.info('[Scheduler] Data analysis Job finished successfully.');
      };

      if (scheduled) {
        const { TWEET_EXTRACTION_FREQUENCY } = global.CONFIGURATION;
        await this.scheduleJob(TWEET_EXTRACTION_FREQUENCY, DataJob);
      } else {
        DataJob();
      }
    }
  }

  async updateConfiguration(enabled = true, scheduleOn = true) {
    if (enabled) {
      const UpdateConfigurationJob = async () => {
        const currentConfig = global.CONFIGURATION;
        await this.ConfigurationFactory._CreateConfiguration();
        const newConfig = global.CONFIGURATION;
        const configKeys = _.keys(global.CONFIGURATION);

        for (let job of configKeys) {
          switch (job) {
            case 'TWEET_EXTRACTION_FREQUENCY':
              if (currentConfig.TWEET_EXTRACTION_FREQUENCY !== newConfig.TWEET_EXTRACTION_FREQUENCY) {
                this.exactDateJob.destroy();
                this.runTweetsJob();
              }
              break;
            case 'CHECK_CONFIG_FREQUENCY':
              if (currentConfig.CHECK_CONFIG_FREQUENCY !== newConfig.CHECK_CONFIG_FREQUENCY) {
                this.checkConfigJob.destroy();
                this.updateConfiguration();
              }
              break;
            case 'DATA_ANALYSIS_FREQUENCY':
              if (currentConfig.DATA_ANALYSIS_FREQUENCY !== newConfig.DATA_ANALYSIS_FREQUENCY) {
                this.runTestsJob.destroy();
                this.runAnalysisJob();
              }
              break;
            default:
              break;
          }
        }
      };

      UpdateConfigurationJob();
      if (scheduleOn) {
        const { CHECK_CONFIG_FREQUENCY } = global.CONFIGURATION;
        await this.scheduleJob(CHECK_CONFIG_FREQUENCY, UpdateConfigurationJob);
      }
    }
  }
}
module.exports = new Scheduler();
