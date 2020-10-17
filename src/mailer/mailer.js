'use strict';

class Mailer {
  constructor() {
    this.axios = require('axios');
    this.logger = require('../commons/logger/logger');
    this.formatter = require('../formatter');
    this.StatusConstants = require('../commons/constants/status.constants')
  }


  async scheduledMailer(){

    const self = this;
    const targets = global.CONFIGURATION.SCHEDULED_LIST;

    const testResults = await this.tester.runTests();
    const email = await this.formatter.formatReport(testResults);

    // targets.forEach(async (target) => {
    //   await self.sendMail(target, 'Monitoração SD', email);
    // });
  }

  async emergencyMailer(){

    const testResults = await this.tester.runTests();
    let error = false;
    for (const test of testResults) {
      if (test.Status == this.StatusConstants.GENERAL_ERROR){
        error = true;
      }
    }

    if (error){
      this.logger.info(`[Mailer] A test failed during health check and an email will be sent with the current status.`)
      const self = this;
      const targets = global.CONFIGURATION.ISSUES_LIST;

      const email = await this.formatter.formatReport(testResults);
      
      targets.forEach(async (target) => {
        // await self.sendMail(target, 'Monitoração SD', email);
      })
    } else {
      this.logger.info(`[Mailer] A healtcheck was run successfully and no email was sent.`)
    }
  }


  async sendMail(target, subject, value) {
    this.logger.info(`[SDWatch][Mailer] Beginning email sending process`);

    const body = {
      to: target,
      value,
      from: 'sdwatch@oi.digital',
      subject,
      type: 'text/html',
      custom_args: { 'id-email': '000' },
      callback_url: process.env.EMAIL_CALLBACK
    };

    const headers = {
      Authorization: process.env.EMAILOI_AUTH,
      'Content-Type': 'application/json'
    };
    try {
      const res = await this.axios.post(process.env.EMAILOI_URL, body, headers);
      this.logger.info(`[SDWatch][Mailer] Email sent successfully.`);
    } catch (err) {
      this.logger.error(`[SDWatch][Mailer] Error occurred while sending emails ${err}`);
    }
  }
}

module.exports = new Mailer();