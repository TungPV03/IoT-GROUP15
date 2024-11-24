require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const http = require("http");
const cors = require("cors");
const startMonitoring = require("./utils/temperatureAlert");
const os = require('os');

// Hàm để lấy địa chỉ IP cục bộ
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (let interfaceName in interfaces) {
    for (let interface of interfaces[interfaceName]) {
      // Kiểm tra xem địa chỉ có phải là IPv4 và không phải là địa chỉ localhost
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address; // Trả về địa chỉ IP đầu tiên tìm thấy
      }
    }
  }
  return 'localhost'; 
};


const app = express();
const server = http.createServer(app);

// Kết nối tới MongoDB trước khi khởi động server
connectDB();

const { initSocket } = require("./broadcast");

initSocket(server);

app.use(cors());
app.use(express.json());

// Các route
const feedLogRoutes = require("./routes/feedLog");
const feedTimeRoutes = require("./routes/feedTime");
const temperatureRoutes = require("./routes/temperature");
const loginRoutes = require("./routes/login");
const deviceRoutes = require("./routes/device");

app.use("/api/feed-log", feedLogRoutes);
app.use("/api/feed-time", feedTimeRoutes);
app.use("/api/temperature", temperatureRoutes);
app.use("/api/auth", loginRoutes);
app.use("/api/device", deviceRoutes);

// Khởi động server
const startServer = () => {
  const port = process.env.PORT || 3000;

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://${getLocalIP()}:${port}`);
    startMonitoring();
  });
};

startServer();
