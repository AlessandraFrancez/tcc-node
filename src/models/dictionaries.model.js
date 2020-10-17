'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DictSchema = new Schema({
  word: { type: String, required: true },
  replacement: { type: String, required: true },
  type: { type: String, required: true },
}, {
  timestamps: true
});

module.exports = mongoose.model('Dictionaries', DictSchema);
