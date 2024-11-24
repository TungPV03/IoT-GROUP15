// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Kết nối đến MongoDB Atlas hoặc cơ sở dữ liệu MongoDB cục bộ
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Kết thúc quá trình nếu có lỗi
  }
};

module.exports = connectDB;
