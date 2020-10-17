'use strict';

class BaseLog {
  constructor() {
    this.logger = require('../logger/logger');
    this.PropertyUtils = require('../utils/property.utils');

    let logPrefix = '';

    const getPrefix = () => {
      if (!logPrefix) {
        if (process.env.NODE_ENV === 'development') {
          const now = this.PropertyUtils.formatDate({ format: 'DD/MM/YY HH:mm:ss' });
          logPrefix += `[${now}]`;
        }
        logPrefix += `[Worker][${this.constructor.name}]`;
      }
      return logPrefix;
    };
    getPrefix();

    this.log = {
      info: (...logs) => this.logger.info(getPrefix(), ...logs),
      debug: (...logs) => this.logger.debug(getPrefix(), ...logs),
      error: (...logs) => this.logger.error(getPrefix(), ...logs),
      verbose: (...logs) => this.logger.verbose(getPrefix(), ...logs)
    };
  }
}

module.exports = BaseLog;
