'use strict';

const BaseLog = require('../base_worker/base.log');

class SchedulerUtils extends BaseLog {
  constructor() {
    super();
    this.fs = require('fs');
    this.path = require('path');
    this.moment = require('moment');
  }

  getTimeFromString(time){
    if (time.length != 5){
      return false;
    }

    const hour = parseInt(time.slice(0,2));
    const minute = parseInt(time.slice(3,5));

    return { hour, minute};
  }



}
module.exports = new SchedulerUtils();
