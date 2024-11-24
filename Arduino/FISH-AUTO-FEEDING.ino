#include <WiFi.h>         // Thư viện Wi-Fi cho ESP32
#include <HTTPClient.h>   // Thư viện HTTPClient để gửi HTTP request
#include <ArduinoJson.h>  // Thư viện ArduinoJson để tạo JSON payload
#include <DallasTemperature.h>
#include <OneWire.h>
#include <WebSocketsClient.h>
#include "Arduino.h"
#include "uRTCLib.h"
#include <ESP32Servo.h>

// Thông tin Wi-Fi
const char* ssid = "PETIT";
const char* password = "012345679";

WebSocketsClient webSocket;                       // Đối tượng WebSocket
const char* websocketServer = "192.168.149.237";  // Thay bằng IP của server WebSocket của bạn
const int websocketPort = 3001;                   // Port của server WebSocket
const char* websocketPath = "/";

//ID thiết bị
const String deviceIdESP32 = "ESP32-001";
const String deviceIdDS3231 = "DS3231-001";
const String deviceIdDS18B20 = "DS18B20-001";
const String deviceIdServo = "Servo-001";

// Địa chỉ server Express.js
const char* serverUrl = "http://192.168.149.237:3001";

// Thông tin đăng nhập
const char* email = "admin@vipro.com";
const char* passwordAuth = "123456@";

#define ONE_WIRE_BUS 19
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

//Servo + RTC
uRTCLib rtc(0x68);
const int servoPin = 18;
Servo myServo;
bool servoOpened = false;

String authToken;  // Token xác thực
unsigned long lastCheckTime = 0;
const unsigned long checkInterval = 5000;

String targetTimes[20];   // Mảng lưu thời gian ăn, tùy chỉnh kích thước theo nhu cầu
int targetTimesSize = 0;  // Kích thước thực tế của mảng

void getFeedTimes() {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/feed-time/active");  // Endpoint GET
  http.addHeader("Authorization", "Bearer " + authToken);

  int httpResponseCode = http.GET();

  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Received feed times: " + response);

    // Parse JSON response
    StaticJsonDocument<300> jsonDoc;
    DeserializationError error = deserializeJson(jsonDoc, response);

    if (error) {
      Serial.println("Failed to parse JSON: " + String(error.c_str()));
    } else {
      JsonArray timesArray = jsonDoc.as<JsonArray>();
      targetTimesSize = min(timesArray.size(), sizeof(targetTimes) / sizeof(targetTimes[0]));

      for (int i = 0; i < targetTimesSize; i++) {
        for (int i = 0; i < targetTimesSize; i++) {
          JsonObject obj = timesArray[i];
          targetTimes[i] = obj["feedTime"].as<String>();
        }
      }

      Serial.println("Updated target times:");
      for (int i = 0; i < targetTimesSize; i++) {
        Serial.println(targetTimes[i]);
      }
    }
  } else {
    Serial.println("Error getting feed times: " + String(httpResponseCode));
  }

  http.end();
}

//gửi id của các thiết bị
void sendDeviceId(String deviceId, String deviceName) {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/device/");  // Endpoint "/"
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + authToken);

  // Tạo JSON payload chứa ID thiết bị
  StaticJsonDocument<100> jsonDoc;
  jsonDoc["deviceId"] = deviceId;
  jsonDoc["deviceName"] = deviceName;
  String jsonData;
  serializeJson(jsonDoc, jsonData);

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Device registered successfully: " + response);
  } else {
    Serial.println("Error registering device: " + String(httpResponseCode));
  }

  http.end();
}

bool isDS18B20Disconnected() {
  sensors.requestTemperatures();  // Yêu cầu dữ liệu từ DS18B20
  float temperature = sensors.getTempCByIndex(0);

  // Kiểm tra xem giá trị nhiệt độ có hợp lệ hay không
  if (temperature == -127.0) {
    Serial.println("DS18B20 is disconnected!");
    return true;
  }

  return false;  // DS18B20 đang hoạt động bình thường
}

// bool isDS3231Disconnected() {
//   rtc.refresh();
//   // Kiểm tra chip RTC có sẵn không
//   if (!rtc.) {
//     Serial.println("DS3231 is disconnected!");
//     return true;
//   }

//   return false; // DS3231 đang hoạt động bình thường
// }

void notifySensorDisconnected(const String& deviceId) {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/device/disconnect");  // Endpoint thông báo
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + authToken);

  // Tạo JSON payload
  StaticJsonDocument<100> jsonDoc;
  jsonDoc["deviceId"] = deviceId;

  String jsonData;
  serializeJson(jsonDoc, jsonData);

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode == 200) {
    Serial.println("Device disconnect notification sent successfully.");
  } else {
    Serial.println("Failed to send disconnect notification: " + String(httpResponseCode));
  }

  http.end();
}

// Hàm đăng nhập để lấy token
bool login() {
  // Tạo URL cho yêu cầu đăng nhập
  String loginUrl = String(serverUrl) + "/api/auth/login";
  Serial.println("URL yêu cầu đăng nhập: " + loginUrl);  // In ra URL

  HTTPClient http;
  http.begin(loginUrl);  // Endpoint đăng nhập

  http.addHeader("Content-Type", "application/json");

  // Tạo JSON payload cho thông tin đăng nhập
  StaticJsonDocument<200> jsonDoc;
  jsonDoc["email"] = email;
  jsonDoc["password"] = passwordAuth;

  String jsonData;
  serializeJson(jsonDoc, jsonData);

  // In ra body đã gửi
  Serial.println("Dữ liệu JSON gửi lên server: " + jsonData);  // In ra body đã gửi

  int httpResponseCode = http.POST(jsonData);

  // In ra mã phản hồi và dữ liệu nhận được
  Serial.print("Mã phản hồi từ server: ");
  Serial.println(httpResponseCode);

  if (httpResponseCode == 200) {
    // Đọc token từ phản hồi JSON
    String response = http.getString();
    StaticJsonDocument<200> responseJson;
    deserializeJson(responseJson, response);
    authToken = responseJson["token"].as<String>();  // Giả sử server trả về token trong trường "token"

    Serial.println("Đăng nhập thành công! Token: " + authToken);
    http.end();
    return true;
  } else {
    Serial.println("Lỗi đăng nhập: " + String(httpResponseCode));
    String response = http.getString();  // Lấy phản hồi để kiểm tra lỗi
    Serial.println("Phản hồi từ server: " + response);
    http.end();
    return false;
  }
}

// Hàm gửi thông tin về nhiệt độ lên server
void postTemeprature(float temperature) {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/temperature/");  // Endpoint "/"
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + authToken);

  // Tạo JSON payload
  StaticJsonDocument<100> jsonDoc;
  jsonDoc["temperature"] = temperature;

  String jsonData;
  serializeJson(jsonDoc, jsonData);

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Dữ liệu đã được gửi: " + jsonData);
  } else {
    Serial.println("Lỗi khi gửi dữ liệu: " + String(httpResponseCode));
  }

  http.end();
}

void feed(String currentTime) {
  Serial.println("Opening servo for 3 seconds...");
  myServo.write(90);
  delay(3000);
  myServo.write(0);

  HTTPClient http;
  http.begin(String(serverUrl) + "/api/feed-log/");  // Endpoint "/"
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + authToken);

  // Tạo JSON payload
  StaticJsonDocument<100> jsonDoc;
  jsonDoc["status"] = "success";
  jsonDoc["time"] = currentTime;

  String jsonData;
  serializeJson(jsonDoc, jsonData);

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Dữ liệu đã được gửi: " + jsonData);
    Serial.println("Phản hồi từ server: " + response);
  } else {
    Serial.println("Lỗi khi gửi dữ liệu: " + String(httpResponseCode));
  }

  http.end();
}

void handleWebSocketMessage(const String& message) {
  Serial.println("[WEBSOCKET] Received message:");

  // Phân tích JSON từ thông điệp
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);

  // Kiểm tra nếu việc phân tích JSON thành công
  if (error) {
    Serial.print(F("Failed to parse JSON: "));
    Serial.println(error.f_str());
    return;
  }

  // Lấy tên sự kiện từ JSON
  String eventName = doc["event"];
  Serial.print("Event Name: ");
  Serial.println(eventName);

  // Xử lý từng sự kiện cụ thể
  if (eventName == "updateFeedTimes") {
    Serial.println("Handling 'updateFeedTimes' event...");
    JsonArray feedTimes = doc["data"].as<JsonArray>();

    // Cập nhật mảng targetTimes
    int index = 0;
    for (JsonObject feedTime : feedTimes) {
      String feedTimeValue = feedTime["feedTime"].as<String>();
      targetTimes[index++] = feedTimeValue;
      Serial.print("Feed Time: ");
      Serial.println(feedTimeValue);
    }
  } else if (eventName == "activateServo") {
    Serial.println("Received 'activateServo' event: Activating servo!");
    //feed();
  }
}

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("[WEBSOCKET] Disconnected");
      break;
    case WStype_CONNECTED:
      Serial.println("[WEBSOCKET] Connected to server");
      webSocket.sendTXT("{\"event\":\"subscribe\", \"data\":{}}");
      break;
    case WStype_TEXT:
      Serial.println("[WEBSOCKET] Received Event");
      handleWebSocketMessage(String((char*)payload));
      break;
    case WStype_BIN:
      Serial.println("[WEBSOCKET] Received binary message");
      break;
    default:
      Serial.println("[WEBSOCKET] Unknown event");
      break;
  }
}


char daysOfTheWeek[7][12] = { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };


void setup() {
  Serial.begin(115200);  // Khởi tạo màn hình serial

  // Kết nối Wi-Fi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println(".");
  Serial.println("Connected to WiFi");

  // Kết nối tới server Socket.io
  webSocket.begin(websocketServer, websocketPort, websocketPath);
  webSocket.onEvent(webSocketEvent);

  //Kết nối DS18B20
  sensors.begin();

  //DS3231 + Servo
  URTCLIB_WIRE.begin();

  //Đặt thời gian lần đầu cho RTC ()
  //rtc.set(0, 0, 4, 5, 32, 11, 24);

  //Gán chân cho servo
  myServo.attach(servoPin);
  myServo.write(0);

  // Đăng nhập và lấy token
  if (!login()) {
    Serial.println("Không thể đăng nhập. Kiểm tra lại email/mật khẩu.");
  }
  sendDeviceId(deviceIdESP32, "ESP32 Wroom 32s NodeMCU");
  sendDeviceId(deviceIdDS3231, "DS3231");
  sendDeviceId(deviceIdDS18B20, "DS18B20");
  sendDeviceId(deviceIdServo, "Servo MG90S");
}

void loop() {
  // Yêu cầu nhiệt độ từ cảm biến
  sensors.requestTemperatures();
  float temperature = sensors.getTempCByIndex(0);

  // Lấy giờ và phút hiện tại
  rtc.refresh();
  int currentHour = rtc.hour();
  int currentMinute = rtc.minute();
  int currentSecond = rtc.second();
  // Định dạng thời gian hiện tại thành chuỗi "HH:mm"
  String currentTime = (currentHour < 10 ? "0" : "") + String(currentHour) + ":" + (currentMinute < 10 ? "0" : "") + String(currentMinute);
  Serial.println(currentTime);
  if (WiFi.status() == WL_CONNECTED && authToken.length() > 0) {
    webSocket.loop();
    //Gửi nhiệt độ lên servo
    postTemeprature(temperature);

    //Lấy mảng thời gian mỗi 1 phút
    getFeedTimes();

    /*
    if (millis() - lastCheckTime > checkInterval) {
      lastCheckTime = millis();
      if (isDS18B20Disconnected()) {
        notifySensorDisconnected(deviceIdDS18B20);  // Gửi thông báo cho DS18B20
      }
    }
    */

    //Cho an
    if (!servoOpened) {
      for (int i = 0; i < sizeof(targetTimes) / sizeof(targetTimes[0]); i++) {
        if (currentTime == targetTimes[i]) {
          feed(currentTime);
          servoOpened = true;
          break;
        }
      }
    }

  } else {
    Serial.println("Wi-Fi không kết nối hoặc token chưa có.");
  }
  delay(60000);
  servoOpened = false;
}
