'use strict';

class AmqpFactory {
  constructor() {
    this.amqp = require('amqplib');
    this.uri = process.env.RABBITMQ_URI;
    this.channel;
  }

  async getChannel() {
    if (!this.channel) {
      const connection = await this.amqp.connect(this.uri);
      this.channel = await connection.createChannel();
    }
    return this.channel;
  }

  async getNewChannel() {
    const connection = await this.amqp.connect(this.uri);
    return connection.createChannel();
  }

  async hasConnection(uri) {
    let success = true;
    try {
      const connection = await this.amqp.connect(uri);
      const channel = await connection.createChannel();
      await channel.close();
      await connection.close();
    } catch (e) {
      success = false;
    }
    return success;
  }
}

module.exports = new AmqpFactory();
