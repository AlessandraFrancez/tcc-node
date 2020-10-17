'use strict';

class PropertyUtils {
  constructor() {
    this.moment = require('moment');
  }

  getCronHour(frequency, type = 'hours') {
    if (type === 'hours'){
      if (frequency < 24) {
        return `0 */${frequency} * * *`;
      } else {
        const days = Math.floor(frequency / 24);
        return `0 0 */${days} * *`;
      }
    }
    else {
      return `*/${frequency} * * * *`
    }
  }
}

module.exports = new PropertyUtils();
