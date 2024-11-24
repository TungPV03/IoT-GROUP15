import { update } from "firebase/database"
import axiosInstance from "../index"

const FeedTimeService = {
  create: async (time, repeatDaily) => {
    const alarmData = {
      feedTime: time,
      repeatDaily,
      active: true,
    }

    try {
      const response = await axiosInstance.post("/feed-time", alarmData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error create feed time")
    }
  },
  getTimeList: async () => {
    try {
      const response = await axiosInstance.get("/feed-time")
      return response.data
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error fetch feed time list"
      )
    }
  },
  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/feed-time/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error delete feed time")
    }
  },
  update: async (id, time, repeatDaily, active) => {
    try {
      const response = await axiosInstance.put(`/feed-time/${id}`, {
        time,
        repeatDaily,
        active,
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error update feed time")
    }
  },
}

export default FeedTimeService
