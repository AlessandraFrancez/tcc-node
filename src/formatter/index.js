

class Formatter {
  constructor() {
    this.logger = require('../commons/logger/logger');
    this.StatusConstants = require('../commons/constants/status.constants');
    this.Mailer = require('../mailer/mailer');
    this.fs = require('fs');
    this.path = require('path');
    this.ejs = require('ejs');
    this.mjml = require('mjml');
    this.moment = require('moment-timezone');
  }

  async formatReport(testResults){
    
    const template = this.fs.readFileSync(this.path.join(__dirname, '../formatter/templates/default.email.template.ejs'), 'utf-8');
    const timeProcessed = this.moment();

    let content = this.mjml(this.ejs.render(template, { testResults, timeProcessed: this.moment(timeProcessed, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY HH:mm:ss') })).html;
    
    return content;

  }

  
  
}

module.exports = new Formatter();