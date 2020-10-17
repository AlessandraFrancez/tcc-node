'use strict';

class ConfigurationFactory {
  constructor() {
    // this.configModel = require('../../models/config.model');
    this.logger = require('../logger/logger');
  }

  async initialize() {
    await this._CreateConfiguration();
  }

  async updateConfiguration(Params) {
    const Configuration = await this.configModel.findOneAndUpdate(Params).lean();
    this._updateGlobal(Configuration);
  }

  async _CreateConfiguration() {
    const Configuration = (await this.configModel.findOne({}).lean()) || (await this.configModel.create({}));
    this._updateGlobal(Configuration);
    this.logger.verbose('Configuration updated');
  }

  _updateGlobal(Configuration) {
    global.CONFIGURATION = { ...Configuration.Emails, ...Configuration.Scheduler };
  }
}

module.exports = new ConfigurationFactory();
