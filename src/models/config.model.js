'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConfigSchema = new Schema({
  query: { type: String, required: true},
  tweets: { type: Number, required: true},
  exclude: { type: Array},
  createdAt: { type: Date, expires: 60 * 60 * 24 * 30 * 6, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Configurations', ConfigSchema);