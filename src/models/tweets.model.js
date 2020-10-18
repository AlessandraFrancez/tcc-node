'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TweetsSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    createdAt: { type: Date, expires: 60 * 60 * 24 * 30, default: Date.now }, // TTL
    text: { type: String, required: true },
    originalText: { type: String },
    status: { type: String, required: true },
    query: { type: String, required: true },
    language: { type: String },
    user_id: { type: String },
    entities: { type: Array },
    followers_count: { type: Number },
    friends_count: { type: Number },
    place: { type: String },
    verified: { type: Boolean },
    retweet_count: { type: Number },
    favorite_count: { type: Number },
    watsonEntities: { type: Array },
    intents: { type: Array },
    tones: { type: Array },
    watsonTranslation: { type: String },
    googleTranslation: { type: String }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Tweets', TweetsSchema);
