const express = require("express");
const router = express.Router();
const FeedTime = require("../models/FeedTime");
const { broadcastFeedTimes, broadcastFeedNow } = require("../broadcast"); // Import hàm broadcast từ broadcast.js
const authMiddleware = require("../authMiddleware");

// Lấy danh sách tất cả các thời gian cho ăn
router.get("/", authMiddleware, async (req, res) => {
  try {
    const feedTimes = await FeedTime.find();
    res.json(feedTimes);
  } catch (error) {
    console.error("Error fetching feed times:", error);
    res.status(500).json({ message: "Error fetching feed times", error });
  }
});

// Lấy danh sách tất cả các thời gian cho ăn đang active
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const feedTimes = await FeedTime.find({active: true});
    const formatData = feedTimes.map(item => {
      return {
        feedTime: item.feedTime
      }
    })
    res.json(formatData);
  } catch (error) {
    console.error("Error fetching feed times:", error);
    res.status(500).json({ message: "Error fetching feed times", error });
  }
});

// Tạo mới thời gian cho ăn
router.post("/", authMiddleware, async (req, res) => {
  const { feedTime, active, repeatDaily } = req.body;

  try {
    // Kiểm tra xem feedTime đã tồn tại chưa
    let feedTimeEntry = await FeedTime.findOne({ feedTime });
    if (feedTimeEntry) {
      return res
        .status(400)
        .json({ message: "Feed time already exists. Use PUT to update." });
    }

    // Tạo feedTime mới
    feedTimeEntry = new FeedTime({ feedTime, active, repeatDaily });
    await feedTimeEntry.save();

    // Gửi tín hiệu real-time tới tất cả các sensor đang kết nối
    broadcastFeedTimes();

    res.json({ message: "Feed time created successfully", feedTimeEntry });
  } catch (error) {
    console.error("Error creating feed time:", error);
    res.status(500).json({ message: "Error creating feed time", error });
  }
});

// Cập nhật thời gian cho ăn đã tồn tại
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { time, active, repeatDaily } = req.body;

  try {
    const feedTimeEntry = await FeedTime.findById(id);
    if (!feedTimeEntry) {
      return res.status(404).json({ message: "Feed time not found" });
    }

    // Cập nhật các trường
    feedTimeEntry.active = active;
    feedTimeEntry.repeatDaily = repeatDaily;
    feedTimeEntry.feedTime = time;
    await feedTimeEntry.save();

    // Gửi tín hiệu real-time tới tất cả các sensor đang kết nối
    broadcastFeedTimes();

    res.json({ message: "Feed time updated successfully", feedTimeEntry });
  } catch (error) {
    console.error("Error updating feed time:", error);
    res.status(500).json({ message: "Error updating feed time", error });
  }
});

// Xóa thời gian cho ăn
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const feedTimeEntry = await FeedTime.findByIdAndDelete(id);
    if (!feedTimeEntry) {
      return res.status(404).json({ message: "Feed time not found" });
    }

    // Gửi tín hiệu real-time tới tất cả các sensor đang kết nối
    broadcastFeedTimes();

    res.json({ message: "Feed time deleted successfully", feedTimeEntry });
  } catch (error) {
    console.error("Error deleting feed time:", error);
    res.status(500).json({ message: "Error deleting feed time", error });
  }
});

//route cho cá ăn thủ công
router.post("/feed", authMiddleware, (req, res) => {
  broadcastFeedNow();
  res.json({ message: "Feeding command broadcasted" });
});

module.exports = router;
