import axiosInstance from ".."

const TemperatureService = {
  getTemperatureData: async () => {
    try {
      const response = await axiosInstance.get("/temperature")
      return response.data
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error fetching temperature data"
      )
    }
  },
  setThreshold: async (min, max) => {
    try {
      const response = await axiosInstance.post("/temperature/threshold", {
        min,
        max,
      })
      return response.data
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error setting threshold"
      )
    }
  },
  putThreshold: async (id, min, max) => {
    try {
      const response = await axiosInstance.put(`/temperature/threshold/${id}`, {
        min,
        max,
      })
      return response.data
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error setting threshold"
      )
    }
  },
  getThreshold: async () => {
    try {
      const response = await axiosInstance.get("/temperature/threshold")
      return response.data
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error fetching threshold"
      )
    }
  },
  deteleThreshold: async (id, min, max) => {
    try {
      const response = await axiosInstance.delete(
        `/temperature/threshold/${id}`
      )
      return response.data
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error deleting threshold"
      )
    }
  },
}

export default TemperatureService
