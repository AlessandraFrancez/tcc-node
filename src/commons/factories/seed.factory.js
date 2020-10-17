'use strict';

class SeedFactory {
  constructor() {
    this.fs = require('fs');
    this.logger = require('../logger/logger');
    this.timers = require('../../models/timers.model');
    this.config = require('../../models/config.model');
    this.dictionary = require('../../models/dictionaries.model');
  }

  async initialize() {
    const timers = this.timers.findOne({});
    if (timers.POPULATE_DB) {
      const configSeed = JSON.parse(this.fs.readFileSync('../../seeds/config_seed.json'));
      await this.config.insertMany(configSeed);

      const dictSeed = JSON.parse(this.fs.readFileSync('../../seeds/dict_seed.json'));
      await this.dictionary.insertMany(dictSeed);

      timers.POPULATE_DB = false;
      await timers.save();
    }
  }
}

module.exports = new SeedFactory();
