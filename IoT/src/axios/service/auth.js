import axiosInstance from "../index"

const AuthService = {
  login: async (email, password, remember) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      })
      if(remember){
        localStorage.setItem("authToken", response.data.token)
      }
      return response.data // Trả về dữ liệu phản hồi từ server
    } catch (error) {
      // Xử lý lỗi nếu cần
      throw error.response?.data?.message || "Error logging in" // Trả về thông báo lỗi
    }
  },
  getLoginEmails: async () => {
    try {
      const response = await axiosInstance.get("/auth")
      return response.data
    } catch (error) {
        throw error.response?.data?.message || "Error fetch data"
    }
  },
  logout: () => {
    localStorage.removeItem("authToken")
  }
}

export default AuthService
