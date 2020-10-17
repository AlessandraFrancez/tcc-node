'use strict';

class AmqpUtils {
  constructor() {
    this.Queue = require('../constants/queue.constants');
    this.ConnectionFactory = require('../factorys/amqp.factory');
  }

  async publisher(queue, message) {
    const channel = await this.ConnectionFactory.getChannel();
    const { JSONtoBuffer, StringToBuffer } = require('./buffer.utils');
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, typeof (message) === 'object' ? JSONtoBuffer(message) : StringToBuffer(message), { persistent: true });
  }

  async remove(queue, message) {
    const channel = await this.ConnectionFactory.getChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.ack(message);
  }

  async restore(queue, message) {
    const channel = await this.ConnectionFactory.getChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.nack(message, true, true);
  }
}

module.exports = new AmqpUtils();
