import axios from "axios"

// Tạo một instance Axios
const axiosInstance = axios.create({
  baseURL: "http://localhost:3001/api", // Thay đổi baseURL nếu cần
  timeout: 10000, // Thời gian timeout tối đa (10 giây)
  headers: {
    "Content-Type": "application/json",
  },
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken"); // Giả định bạn lưu token trong localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Thêm token vào header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance