const mongoose = require('mongoose');

const thresholdSchema = new mongoose.Schema({
  min: {
    type: Number,
    required: true, // yêu cầu trường này phải có giá trị
  },
  max: {
    type: Number,
    required: true, // yêu cầu trường này phải có giá trị
  },
});

// Export model
module.exports = mongoose.model('Threshold', thresholdSchema);
