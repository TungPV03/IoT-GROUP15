const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const Threshold = require("../models/Threshold");
const Temperature = require("../models/Temperature");

// Khởi tạo transport để gửi email
const transporter = nodemailer.createTransport({
  service: "gmail", // Sử dụng Gmail, có thể thay đổi theo email của bạn
  auth: {
    user: process.env.SENDER_MAIL,
    pass: process.env.SENDER_MAIL_PASS,
  },
});

const sendEmailNotification = async () => {
  const threshold = await Threshold.findOne(); // Giả sử chỉ có một ngưỡng duy nhất
  if (!threshold) {
    console.error("Threshold is not set.");
    return;
  }

  const recentTemperatures = await Temperature.find()
    .sort({ createdAt: -1 })
    .limit(10);

  // Kiểm tra nếu có bản ghi nào vượt ngưỡng
  const countExceedsMaxThreshold = recentTemperatures.filter(
    (temp) => parseFloat(temp.temperature) > threshold.max
  ).length;
  const countExceedsMinThreshold = recentTemperatures.filter(
    (temp) => parseFloat(temp.temperature) < threshold.min
  ).length;

  // Nếu hơn 50% các bản ghi trong 10 phút qua vượt ngưỡng, gửi email
  if (
    recentTemperatures.length > 8 &&
    (countExceedsMaxThreshold / recentTemperatures.length > 0.5 ||
      countExceedsMinThreshold / recentTemperatures.length > 0.5)
  ) {
    const mailOptions = {
      from: process.env.SENDER_MAIL,
      to: process.env.TARGET_EMAIL,
      subject: "Cảnh báo nhiệt độ!",
      text: `Nhiệt độ đã vượt quá ngưỡng cho phép liên tục trong 10 phút qua.`,
    };
    console.log("SEND MAIL");

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  }
};

const startMonitoring = () => {
  // Gọi hàm này mỗi 1 phút để kiểm tra và gửi thông báo
  console.log("ALOO");
  setInterval(sendEmailNotification, 60 * 1000);
};

module.exports = startMonitoring;
