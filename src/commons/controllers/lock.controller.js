'use strict';

const Redlock = require('redlock');

class LockFactory {
  constructor() {
    this.redis = require('redis');
    this.ioredis = require('ioredis');
    this.redlock = false;

  }

  async initialize() {

    let client = new this.ioredis({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT, password: process.env.REDIS_PASS })

    return new Redlock([client], {
      retryCount: 5,
      retryDelay: 200, // time in ms
      retryJitter: 200 // time in ms
    });
  }

  async handleLock(resource) {
    if (!this.redlock) {
      this.redlock = await this.initialize();
    }
    console.log(`Handling lock for resource ${resource}`);
    let lock = await this.redlock.lock(resource, 10000).then(function (lock) {
      console.log(`Lock acquired for resource ${resource}`);
      return lock
    })
      .catch(function (err) {
        const logger = require('../logger/logger')
        logger.verbose(`[LockController] ${resource} already locked by a different instance`);
        return false;
      });

    return lock ? lock : false;
  }


  async handleUnlock(lock) {
    try {
      setTimeout(async () => {
        await lock.unlock()
      }, 5000);
    } catch (err) {
      this.logger.warn(`[LockController] Unable to release lock, it will automatically release after 60 sec. ${err}`);
    }
  }

}

module.exports = new LockFactory()