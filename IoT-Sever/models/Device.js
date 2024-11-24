const mongoose = require('mongoose');

// Tạo schema cho thiết bị
const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,  // Đảm bảo ID thiết bị là duy nhất
  },
  deviceName: {
    type: String,
    required: true,
  },
  connecting: {
    type: Boolean,
    default: true,
  },
  lastConnected: {
    type: Date,
    default: Date.now,  // Lưu thời gian kết nối
  },
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
