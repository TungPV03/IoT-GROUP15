import axiosInstance from ".."

const feedLogService = {
  get: async () => {
    try {
      const response = await axiosInstance.get("/feed-log")
      return response.data
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error fetching feed logs"
      )
    }
  },
}

export default feedLogService
