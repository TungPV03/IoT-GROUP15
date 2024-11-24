import React, { useEffect, useState } from "react"
import { List } from "antd"
// import { getFeedHistory } from "../firebase/services/history"
import dayjs from "dayjs"
import Loading from "./Loading"
import { off, on } from "../axios/service/realtimeService"
import feedLogService from "../axios/service/feedLog"
import { toast } from "material-react-toastify"

interface FeedLog {
  status: string
  feedTime: Date
}

const FeedHistory = () => {
  const [data, setData] =
    useState<{ status: string; time: string; date: string }[]>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const format = "HH:mm DD/MM/YYYY"
    const load = async () => {
      try {
        const data = await feedLogService.get()
        const formattedData = data.map((item: FeedLog) => {
          const timestamp = item.feedTime
          const formattedTime = dayjs(timestamp).format(format)

          return {
            status: item.status,
            time: formattedTime.split(" ")[0],
            date: formattedTime.split(" ")[1],
          }
        })
        setData(formattedData)
      } catch (error) {
        toast.error("Không thể tải lịch sử cho ăn!")
      } finally {
        setLoading(false)
      }
    }

    const handleUpdatedTimes = (data: FeedLog[]) => {
      const formattedData = data.map((item: FeedLog) => {
        const timestamp = item.feedTime
        const formattedTime = dayjs(timestamp).format(format)

        return {
          status: item.status,
          time: formattedTime.split(" ")[0],
          date: formattedTime.split(" ")[1],
        }
      })

      setData(formattedData)
    }

    load()

    on("updateFeedTimes", handleUpdatedTimes)

    // Cleanup khi component unmount
    return () => {
      off("updateFeedTimes", handleUpdatedTimes) // Ngắt lắng nghe sự kiện
    }
  }, [])

  if (loading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Loading />
      </div>
    )
  }
  return (
    <div className="bg-slate-200">
      <List
        header={
          <div className="w-full text-center text-2xl font-bold">
            Lịch sử cho cá ăn
          </div>
        }
        bordered
        dataSource={data}
        renderItem={(item) => (
          <List.Item>
            <span className="text-md font-semibold">[{item.date}]:</span>{" "}
            {`Đã cho cá ăn vào lúc ${item.time}`}
          </List.Item>
        )}
      />
    </div>
  )
}

export default FeedHistory
