'use strict';

const BaseController = require('./base.controller');

class IBMController extends BaseController {
  constructor() {
    this.watson = require('ibm-watson');
    this.axios = require('axios');
    this.logger = require('../logger/logger');
    this.api_key = process.env.WATSON_ASSISTANT_API_KEY;
    this.assistant_id = process.env.WATSON_ASSISTANT_ASSISTANT_ID;
    this.version = process.env.WATSON_ASSISTANT_VERSION;
    this.baseUrl = process.env.WATSON_ASSISTANT_URL;
    this.session = {
      sessionId: '',
      time: ''
    }; // TODO
  }

  async translate(text){

    const res = await this.axios({
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      url: `${process.env.WATSON_TRANSLATOR_URL}/v3/translate?version=${process.env.WATSON_TRANSLATOR_VERSION}`,
      auth: {
        username: 'apikey',
        password: process.env.WATSON_TRANSLATOR_API_KEY
      },
      data: {
        text,
        model_id:"pt-en"
      }
    });

    this.logger.info(res.data);

    return res.data;
  }

  async analyzeTone(text){
    const res = await this.axios({
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      url: `${process.env.WATSON_TONE_URL}/v3/tone?version=${process.env.WATSON_TONE_VERSION}`,
      auth: {
        username: 'apikey',
        password: process.env.WATSON_TONE_API_KEY
      },
      data: {
        text
      }
    });

    this.logger.info(res.data);
    return res.data
  }

  /** @description Creates Watson Assistant session */
  async createSession() {

    const res = await this.axios({
      method: 'post',
      auth: {
        username: 'apikey',
        password: this.api_key
      },
      url: `${this.baseUrl}/v2/assistants/${this.assistant_id}/sessions?version=${this.version}`
    });

    this.logger.info(res.data);

    if (res && res.data && res.data.sessionId) {
      return res.data.sessionId;
    } else {
      return false;
    }

  }

   /** @description Sends message to Watson Assistant */
  async sendMessage(text){
    const sessionId = await this.createSession();

    const res = await this.axios({
      method: 'post',
      headers: {'content-type':'application/json'},
      url: `${this.baseUrl}/v2/assistants/${this.assistant_id}/sessions/${sessionId}/?version=${this.version}`,
      data: {
        input: {
          text,
          options: {
            alternate_intents: true,
            return_context: false
          }
        }
      }
    })

    return res.data;
  }

}

module.exports = new IBMController()