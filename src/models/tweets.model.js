'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const TweetsSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    createdAt:{type: Date, expires: 60*60*24*30, default: Date.now}, // TTL
    text: {type: String, required: true},
    status: { type: String, required: true},
    query: { type: String, required: true},
    entities: { type: Object },
    language: { type: String },
    user_id :{ type: Number },
    followers_count : { type: Number },
    friends_count : { type: Number },
    place : { type: String },
    verified : { type: Boolean },
    retweet_count : { type: Number },
    favorite_count : { type: Number }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Tweets', TweetsSchema);
