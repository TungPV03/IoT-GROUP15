const mongoose = require('mongoose');

const FeedingLogSchema = new mongoose.Schema({
  feedTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  status: {
    type: String,
    default: 'success',
  },
});

module.exports = mongoose.model('FeedingLog', FeedingLogSchema);
