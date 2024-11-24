import axiosInstance from ".."

const DeviceService = {
  get: async () => {
    try {
      const response = await axiosInstance.get("/device")
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error get device")
    }
  },
}

export default DeviceService
