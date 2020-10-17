'use strict';

const BaseLog = require('../base_worker/base.log');
const _ = require('lodash');

class Scheduler extends BaseLog {
  constructor() {
    super();
    this.moment = require('moment');
    this.ConfigurationFactory = require('../factorys/configuration.factory');
    this.cron = require('node-cron');
    this.SchedulerUtils = require('../utils/scheduler.utils');
    this.Mailer = require('../../mailer/mailer');

    this.exactDateJob = false;
    this.checkConfigJob = false;
    this.runTestsJob = false;
  }
//WIP
  async initialize() {
    await this.ConfigurationFactory.initialize();
    this.updateConfiguration();
    this.dailyEmails(false);
    // await this.Mailer.scheduledMailer();
  }

  async scheduleJob(cronParam, job){
    const task = await this.cron.schedule(cronParam, job, {
      scheduled: true,
      timezone: "America/Sao_Paulo"
    });
    return task;
  }

  async planJobs(frequency, job, frequencyType = 'hours'){
    const cronParam = this.PropertyUtils.getCronHour(frequency, frequencyType);
    this.logger.verbose(`[PlanJob] Job: ${job.name} set to ${cronParam}`);
    return await this.scheduleJob(cronParam, job);
  }

  async cancelJobs(JobName){
    this.schedule.cancelJob(JobName);
  }

  async dailyEmails(enabled = true){
    if (enabled){
      const {EMAIL_TIME } = global.CONFIGURATION;
      const { hour, minute } = this.SchedulerUtils.getTimeFromString(EMAIL_TIME);

      const cronParam = `0 ${minute} ${hour} * * *`;

      const dailyEmailsJob = async () => {
        this.logger.info(`[Mailer] Scheduled email job starting`);
        //TODO
        this.logger.info(`[Mailer] ScheduledMailerJob executed successfully.`);
      }

      // console.log(cronParam);
      this.exactDateJob = await this.scheduleJob(cronParam, dailyEmailsJob);
    }
  }

  async updateConfiguration(enabled = true, scheduleOn = true){
    if (enabled){
      const UpdateConfigurationJob = async () => {
        const currentConfig = global.CONFIGURATION;
        await this.ConfigurationFactory._CreateConfiguration();
        const newConfig = global.CONFIGURATION;
        const configKeys = _.keys(global.CONFIGURATION);

        for (let job of configKeys) {
          switch (job) {
            case 'EMAIL_TIME':
              if (currentConfig.EMAIL_TIME !== newConfig.EMAIL_TIME) {
                this.logger.info(`[Mailer] Email time changed to ${newConfig.EMAIL_TIME}`);
                this.exactDateJob.destroy();
                this.dailyEmails();
              }
              break;
            case 'CHECK_CONFIG_FREQUENCY':
              if (currentConfig.CHECK_CONFIG_FREQUENCY !== newConfig.CHECK_CONFIG_FREQUENCY) {
                this.checkConfigJob.destroy();
                this.updateConfiguration();
              }
              break;
            case 'TESTS_FREQUENCY':
              if (currentConfig.TESTS_FREQUENCY !== newConfig.TESTS_FREQUENCY) {
                this.runTestsJob.destroy();
                this.healthcheckTests();
              }
              break;
            default:
              break;
          }
        }
      }
      UpdateConfigurationJob();
      if (scheduleOn){
        const { CHECK_CONFIG_FREQUENCY } = global.CONFIGURATION;
        this.checkConfigJob = this.planJobs(CHECK_CONFIG_FREQUENCY, UpdateConfigurationJob, 'minutes');
      }
    }
  }

}
module.exports = new Scheduler();
