const mongoose = require('mongoose');

const FeedTimeSchema = new mongoose.Schema({
  feedTime: {
    type: String,
    required: true,
    match: /^([0-1]\d|2[0-3]):([0-5]\d)$/, // Định dạng "HH:mm" 24 giờ
  },
  active: {
    type: Boolean,
    default: true,
  },
  repeatDaily: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('FeedTime', FeedTimeSchema);
