
'use strict';

class InputMessageUtils {
  constructor() {
    this.AmqpUtils = require('../utils/amqp.utils.js');
    this.QueueConstants = require('../constants/queue.constants');
  }

  _updateContent({ Content = {} }, object) {
    for (const key in object) {
      Content[key] = { ...Content[key], ...object[key] };
    }
    return Content;
  }

  async sendMessage(data) {
    await this.AmqpUtils.publisher(this.QueueConstants.CHAT_QUEUE, data);
  }
}

module.exports = new InputMessageUtils();
