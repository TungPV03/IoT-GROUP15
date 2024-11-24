import { useEffect, useState } from "react"
import { List } from "antd"
import dayjs from "dayjs"
import Loading from "./Loading"
import DeviceService from "../axios/service/device"
import { toast } from "material-react-toastify"

const ManageDivice = () => {
  const [data, setData] = useState<
    {
      deviceId: string
      deviceName: string
      connecting: boolean
      lastConnected: Date
    }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await DeviceService.get()
        setData(res)
      } catch (error) {
        toast.error("Error loading devices")
      } finally {
        setLoading(false)
      }
    }

    load();
  }, [])

  // Hiển thị Loading nếu đang tải
    if (loading) {
      return (
        <div className="flex w-full h-full items-center justify-center">
          <Loading />
        </div>
      );
    }

  return (
    <div className="bg-[white] p-4 rounded-sm">
      <h1 className="text-lg font-bold mb-4">Quản lý thiết bị</h1>
      <List
        bordered
        dataSource={data}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: item.connecting ? "green" : "gray",
                  }}
                />
              }
              title={<span>{item.deviceName}</span>}
              description={
                <div>
                  <p>ID thiết bị: {item.deviceId}</p>
                  <p>
                    Thời gian kết nối gần nhất:{" "}
                    {dayjs(item.lastConnected).format("HH:mm DD/MM/YYYY")}
                  </p>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )
}

export default ManageDivice
