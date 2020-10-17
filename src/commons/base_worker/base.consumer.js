'use strict';

const BaseLog = require('./base.log');

class BaseConsumer extends BaseLog {
  constructor() {
    super();
    this.MessageHandler = require('./base.message.handler');
    this.ConnectionFactory = require('../factorys/amqp.factory');
    this.QueueConstants = require('../constants/queue.constants');
  }

  async _startConsumer() {
    this.channel = await this.ConnectionFactory.getNewChannel();
    await this.channel.assertQueue(this.originQueue, { durable: true });
    if (this.singleMessage) await this.channel.prefetch(1);
    this.log.verbose(`Starting listening on queue "${this.originQueue}"...`);
    this.channel.consume(this.originQueue, message => {
      if (message) {
        this.log.verbose('Message received. Processing...');
        new this.MessageHandler(this.channel, this.targetQueue).process(message);
      } else {
        this.log.warn('Consumer cancelled by RabbitMQ. Restarting...', {type: 'rabbitmq'});
        this._startConsumer();
      }
    });
  }

  async run(singleMessage = true) {
    this.initialize();
    try {
      this.singleMessage = singleMessage;
      if (!this.originQueue) throw new Error('You need to specify the originQueue property on the initialize method');
      await this._startConsumer();
    } catch (error) {
      this.log.error(error);
      this._startConsumer();
    }
  }
}

module.exports = BaseConsumer;
