const express = require("express");
const router = express.Router();
const Temperature = require("../models/Temperature");
const { broadcastTemperature } = require("../broadcast"); // Đảm bảo import đúng từ broadcast.js
const authMiddleware = require("../authMiddleware");
const Threshold = require("../models/Threshold");

// Lấy tất cả các bản ghi nhiệt độ
router.get("/", authMiddleware, async (req, res) => {
  try {
    const temperatures = await Temperature.find().sort({ createdAt: 1 });
    res.json(temperatures);
  } catch (error) {
    console.error("Error fetching temperatures:", error);
    res.status(500).json({ message: "Error fetching temperatures", error });
  }
});

// Tạo mới bản ghi nhiệt độ
router.post("/", authMiddleware, async (req, res) => {
  const { temperature } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (temperature === undefined || temperature === null) {
    return res.status(400).json({ message: "Temperature value is required." });
  }

  try {
    const newTemperature = new Temperature({ temperature });
    await newTemperature.save();

    // Gửi tín hiệu real-time tới tất cả các client đang kết nối
    broadcastTemperature();

    res.json({ message: "Temperature recorded successfully", newTemperature });
  } catch (error) {
    console.error("Error recording temperature:", error);
    res.status(500).json({ message: "Error recording temperature", error });
  }
});

//route đặt ngưỡng nhiệt độ cho bể cá
router.post("/threshold", authMiddleware, async (req, res) => {
  const { min, max } = req.body;

  if (min === undefined || max === undefined) {
    return res.status(400).json({ message: "Threshold value is required." });
  }

  try {
    const threshold = await Threshold.find();
    if (threshold.length > 0) {
      await Threshold.deleteMany();
    }

    const newThreshold = Threshold({
      min: Number(min),
      max: Number(max),
    });
    await newThreshold.save();

    res.json({ message: "Threshold set successfully" });
  } catch (error) {
    console.error("Error setting threshold:", error);
    res.status(500).json({ message: "Error setting threshold", error });
  }
});

router.delete("/threshold/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const threshold = await Threshold.findByIdAndDelete(id);
    if (!threshold) {
      return res.status(404).json({ message: "Threshold not found" });
    }

    res.json({ message: "Threshold delete successfully", threshold });
  } catch (error) {
    console.error("Error delete threshold:", error);
    res.status(500).json({ message: "Error delete threshold", error });
  }
});

//route sửa lại ngưỡng nhiệt độ an toàn
router.put("/threshold/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { min, max } = req.body;

  try {
    const threshold = await Threshold.findByIdAndUpdate(id, {
      min: Number(min),
      max: Number(max),
    });
    if (!threshold) {
      return res.status(404).json({ message: "Threshold not found" });
    }

    res.json({ message: "Threshold update successfully", threshold });
  } catch (error) {
    console.error("Error update threshold:", error);
    res.status(500).json({ message: "Error update threshold", error });
  }
});

router.get("/threshold", authMiddleware, async (req, res) => {
  try {
    const threshold = await Threshold.find();
    res.json(threshold);
  } catch (error) {
    console.error("Error fetching threshold:", error);
    res.status(500).json({ message: "Error fetching threshold", error });
  }
});

module.exports = router;
