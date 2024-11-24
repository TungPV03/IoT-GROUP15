let socket = null;

const connectSocket = () => {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    socket = new WebSocket("ws://localhost:3001/"); // URL của WebSocket server
    console.log("WebSocket connected");

    // Lắng nghe thông điệp từ server
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleServerEvent(message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    // Xử lý sự kiện khi WebSocket bị đóng
    socket.onclose = () => {
      console.log("WebSocket disconnected");
      socket = null;
    };

    // Xử lý sự kiện khi gặp lỗi
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }
};

const disconnectSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
    console.log("WebSocket disconnected manually");
  }
};

const eventHandlers = {
  updateFeedTimes: [],
  updateFeedLogs: [],
  updateTemperature: [],
};

// Xử lý sự kiện từ server
const handleServerEvent = (message) => {
  const { event, data } = message;

  if (eventHandlers[event]) {
    eventHandlers[event].forEach((callback) => callback(data));
  } else {
    console.warn("Unhandled event:", event);
  }
};

// Đăng ký lắng nghe sự kiện
const on = (eventName, callback) => {
  console.log(`RECIVED EVENT ${eventName}`);
  
  if (eventHandlers[eventName]) {
    eventHandlers[eventName].push(callback);
  } else {
    console.warn(`No handlers available for event: ${eventName}`);
  }
};

// Hủy lắng nghe sự kiện
const off = (eventName, callback) => {
  if (eventHandlers[eventName]) {
    eventHandlers[eventName] = eventHandlers[eventName].filter(
      (handler) => handler !== callback
    );
  }
};

export {
  connectSocket,
  disconnectSocket,
  on,
  off,
};
