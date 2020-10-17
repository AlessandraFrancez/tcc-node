'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TimersSchema = new Schema({
  TWEET_EXTRACTION_FREQUENCY: { type: String, required: true, default: '*/30 * * * *' },
  DATA_ANALYSIS_FREQUENCY: { type: String, required: true, default: '1-59/30 * * * *' },
  CHECK_CONFIG_FREQUENCY: { type: String, required: true, default: '*/10 * * * *' },
  POPULATE_DB: { type: String, required: true, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Timers', TimersSchema);
