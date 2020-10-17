'use strict';

const BaseLog = require('./base.log');

class BaseMessageHandler extends BaseLog {
  constructor(channel, targetQueue) {
    super();
    this.moment = require('moment');
    this.AmqpUtils = require('../../commons/utils/amqp.utils');
    this.InputMessageUtils = require('../utils/inputmessage.utils');
    this.BufferUtils = require('../../commons/utils/buffer.utils');
    this.PropertyUtils = require('../../commons/utils/property.utils');
    this.ConnectionFactory = require('../../commons/factorys/amqp.factory');
    this.QueueConstants = require('../../commons/constants/queue.constants');
    this.channel = channel;
    this.targetQueue = targetQueue;
    this.initialize();
  }

  initialize(...middlewares) {
    this.middlewares = middlewares;
    for (const middleware of this.middlewares) {
      this[middleware.name] = this[middleware.name].bind(this);
    }
  }

  process(Message) {
    const run = async current => {
      try {
        if (current < this.middlewares.length) {
          await this[this.middlewares[current].name](() => run(current + 1));
        } else {
          await this.remove();
        }
      } catch (error) {
        const request = this.BufferUtils.BufferToJSON(Message.content);
        this.currentChat = await this.Chat.findOne({ _id: request._id });
        await this.onError(error);
        await this.remove(error);
      }
    };
    this.currentItem = { Message };
    this.processStartTime = this.moment();
    run(0);
  }

  _calcDuration(end, start) {
    start = start || this.moment();
    let seconds = start.diff(end, 'ms');
    const duration = this.moment.duration(seconds, 'ms');
    let milliseconds = parseInt(duration % 1000);
    seconds = parseInt((duration / 1000) % 60);
    let minutes = parseInt((duration / (1000 * 60)) % 60);
    let hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = hours > 0 ? hours + 'h ' : '';
    minutes = minutes > 0 ? minutes + 'm ' : '';
    seconds = seconds > 0 ? seconds + 's ' : '';
    milliseconds = milliseconds + 'ms';

    return hours + minutes + seconds + milliseconds;
  }

  async onError(error) {
    this.log.error(error);
    if (this.currentChat && this.currentChat.save) {
      try {
        const { Token, ClientId } = this.currentChat;
        this.currentChat.Status = this.ContextStatus.PROCESSERROR;
        this.currentChat.ErrorMessage = error;
        const WatsonError = { Code: this.WatsonConstants.CODE_GENERAL_ERROR };
        await this.ChatController.restartChat({ Token, ClientId, WatsonError });
        await this.currentChat.save();
      } catch (err) {
        this.log.error(`Error trying to update context status: ${err.message}`);
      }
    }
  }

  async remove(error) {
    this.log.verbose(`Message processed in [ ${this._calcDuration(this.processStartTime)} ].`);
    if (error && this.currentChat) {
      this.currentChat.ErrorMessage = error;
      await this.publish(this.currentChat, this.QueueConstants.EVENTS_DISCARDED_QUEUE);
    }
    this.channel.ack(this.currentItem.Message);
    this.log.verbose('Message removed from queue. Waiting new messages...');
  }

  async publish(message, queue = null) {
    queue = queue || this.targetQueue;
    if (!queue) throw new Error('You need to specify what queue you want to publish');
    this.log.verbose(`Starting to publish on queue "${queue}"...`);
    const channel = await this.ConnectionFactory.getChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, typeof message === 'object' ? this.BufferUtils.JSONtoBuffer(message) : this.BufferUtils.StringToBuffer(message), { persistent: true });
  }
}

module.exports = BaseMessageHandler;
