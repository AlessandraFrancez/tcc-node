'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const VotingSchema = new Schema(
  {
    _id: false,
    fetched: { type: Number, required: true, default: 0, index: true },
    entities: { type: Array },
    intents: { type: Array },
    translationLevel: { type: Number },
    alternativeTranslation: { type: Array },
    theme: { type: Array },
    translation: { type: Array },
    company: { type: Array },
    telecom: { type: Array },
    consumer: { type: Array },
    alternativeCompany: { type: Array },
    alternativeTheme: { type: Array },
    selected: { type: Array }

  }
);

const TweetsSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    createdAt: { type: Date, expires: 60 * 60 * 24 * 90, default: Date.now }, // TTL
    checked: { type: Boolean, default: false },
    text: { type: String, required: true },
    originalText: { type: String },
    status: { type: String, required: true },
    query: { type: String, required: true },
    language: { type: String },
    user_id: { type: String },
    entities: { type: Array },
    followers_count: { type: Number },
    friends_count: { type: Number },
    verified: { type: Boolean },
    retweet_count: { type: Number },
    favorite_count: { type: Number },
    watsonEntities: { type: Array },
    intents: { type: Array },
    tones: { type: Array },
    watsonTranslation: { type: String },
    googleTranslation: { type: String },
    voting: { type: VotingSchema, required: true, default: { fetched: 0 } }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Tweets', TweetsSchema);
