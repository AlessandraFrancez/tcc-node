'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DictSchema = new Schema({
  word: { type: String, required: true},
  replacement: { type: String, required: true},
  type: { type: String, required: true},
  createdAt: { type: Date, expires: 60 * 60 * 24 * 30 * 6, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dictionaries', DictSchema);