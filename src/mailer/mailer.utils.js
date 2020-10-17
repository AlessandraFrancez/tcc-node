'use strict';

class MailerUtils {
  constructor() {
    this.logger = require('../commons/logger/logger');
    this.MailerConstants = require('../commons/constants/mailer.constants');
    this.StatusConstants = require('../commons/constants/status.constants');
  }

  prepTestResponse(name, Status, CustomParams = {}){

    const testInfo = this.MailerConstants[name];
    const res = {
      Name: testInfo.name,
      Description: testInfo.description,
      Status,
      CustomParams
    }

    return res
  }
  
}

module.exports = new MailerUtils();