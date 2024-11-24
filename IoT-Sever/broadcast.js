const WebSocket = require("ws");
const FeedTime = require("./models/FeedTime");
const FeedingLog = require("./models/FeedingLog");
const Temperature = require("./models/Temperature");

let wss; // WebSocket Server instance

// Khởi tạo WebSocket server
const initSocket = (httpServer) => {
  wss = new WebSocket.Server({ server: httpServer });

  wss.on("connection", (ws) => {
    console.log("Sensor connected");

    ws.on("close", () => {
      console.log("Sensor disconnected");
    });

    ws.on("message", (message) => {
      console.log("Message received from client:", message);
    });
  });
};

// Hàm gửi tin nhắn đến tất cả các client
const broadcast = (event, data) => {
  if (!wss) {
    console.error("WebSocket server not initialized");
    return;
  }

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event, data }));
    }
  });
};

// Hàm phát lệnh kích hoạt servo
const broadcastFeedNow = () => {
  try {
    broadcast("activateServo", null); // Gửi sự kiện không kèm dữ liệu
  } catch (err) {
    console.error("Failed to activate servo:", err);
  }
};

// Hàm phát danh sách thời gian cho ăn
const broadcastFeedTimes = async () => {
  try {
    const feedTimes = await FeedTime.find();
    broadcast("updateFeedTimes", feedTimes);
  } catch (error) {
    console.error("Error fetching data for broadcasting:", error);
  }
};

// Hàm phát lịch sử cho ăn
const broadcastFeedLogs = async () => {
  try {
    const feedLogs = await FeedingLog.find();
    broadcast("updateFeedLogs", feedLogs);
  } catch (error) {
    console.error("Error fetching data for broadcasting:", error);
  }
};

// Hàm phát nhiệt độ
const broadcastTemperature = async () => {
  try {
    const temperatures = await Temperature.find();
    broadcast("updateTemperature", temperatures);
  } catch (error) {
    console.error("Error fetching data for broadcasting:", error);
  }
};

// Xuất các hàm
module.exports = {
  initSocket,
  broadcastFeedTimes,
  broadcastFeedLogs,
  broadcastTemperature,
  broadcastFeedNow,
};
