const express = require("express");
const router = express.Router();
const { broadcastFeedLogs, broadcastFeedTimes } = require("../broadcast"); // Import hàm broadcast từ broadcast.js
const FeedingLog = require("../models/FeedingLog");
const authMiddleware = require("../authMiddleware");
const FeedTime = require("../models/FeedTime");

// Lấy danh sách tất cả các bản ghi cho ăn
router.get("/", authMiddleware, async (req, res) => {
  try {
    const feedLogs = await FeedingLog.find();
    res.json(feedLogs);
  } catch (error) {
    console.error("Error fetching feed logs:", error);
    res.status(500).json({ message: "Error fetching feed logs", error });
  }
});

// Lưu bản ghi mới về thời gian cho ăn
router.post("/", authMiddleware, async (req, res) => {
  const { status, time } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!status || !time) {
    return res.status(400).json({ message: "Status and time are required." });
  }

  try {
    const feedLog = new FeedingLog({ status });
    await feedLog.save();
    // Tìm và cập nhật FeedTime
    const feedTime = await FeedTime.findOne({ feedTime: time });

    if (!feedTime) {
      return res.status(404).json({ message: "Feed time not found." });
    }

    // Kiểm tra repeatDaily và cập nhật active
    const isRepeatDaily = feedTime.repeatDaily || false;
    feedTime.active = isRepeatDaily;
    await feedTime.save();

    // Gửi tín hiệu real-time tới tất cả các sensor đang kết nối
    broadcastFeedLogs();
    broadcastFeedTimes();
    res.json({ message: "Feed log saved successfully", feedLog });
  } catch (error) {
    console.error("Error saving feed log:", error);
    res
      .status(500)
      .json({ message: "Error saving feed log", error: error.message });
  }
});

module.exports = router;
