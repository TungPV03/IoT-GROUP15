const mongoose = require('mongoose');

const temperatureSchema = new mongoose.Schema({
  temperature: {
    type: String,
    required: true, // yêu cầu trường này phải có giá trị
  },
  createdAt: {
    type: Date,
    default: Date.now, // tự động lưu thời gian hiện tại khi tạo mới
  },
});

// Export model
module.exports = mongoose.model('Temperature', temperatureSchema);
