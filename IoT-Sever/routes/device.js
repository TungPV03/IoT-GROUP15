const express = require("express");
const Device = require("../models/Device"); // Import schema thiết bị
const authMiddleware = require("../authMiddleware");
const router = express.Router();

// API đăng ký thiết bị mới
router.post("/", authMiddleware, async (req, res) => {
  const { deviceId, deviceName } = req.body;

  if (!deviceId || !deviceName) {
    return res
      .status(400)
      .json({ message: "Device ID and Device Name are required" });
  }

  try {
    // Kiểm tra xem thiết bị đã tồn tại chưa
    let device = await Device.findOne({ deviceId });

    if (device) {
      // Nếu thiết bị đã tồn tại, cập nhật thời gian kết nối
      device.lastConnected = Date.now();
      device.connecting = true;
      await device.save();
      return res
        .status(200)
        .json({ message: "Device updated successfully", device });
    }

    // Nếu thiết bị chưa tồn tại, tạo thiết bị mới
    device = new Device({
      deviceId,
      deviceName,
    });

    await device.save();
    res.status(201).json({ message: "Device registered successfully", device });
  } catch (error) {
    console.error("Error registering device:", error);
    res.status(500).json({ message: "Error registering device", error });
  }
});

router.post("/disconnect", async (req, res) => {
  const { deviceId } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "Missing deviceId" });
  }

  try {
    // Cập nhật trạng thái thiết bị trong cơ sở dữ liệu
    await Device.findOneAndUpdate({ deviceId }, { connecting: false });

    console.log(`Device ${deviceId} marked as disconnectd`);
    res.status(200).json({ message: `Device ${deviceId} marked as disconnectd` });
  } catch (error) {
    console.error("Error updating device status:", error);
    res.status(500).json({ error: "Failed to update device status" });
  }
});

// API lấy danh sách tất cả thiết bị
router.get("/", authMiddleware, async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ message: "Error fetching devices", error });
  }
});

module.exports = router;
