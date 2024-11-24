import React, { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faAdd,
  faTemperatureThreeQuarters,
} from "@fortawesome/free-solid-svg-icons"
import { on, off } from "../axios/service/realtimeService"
import TemperatureService from "../axios/service/temperature"
import { FloatButton, message, Tooltip } from "antd"
import type { InputNumberProps } from "antd"
import { InputNumber, Modal } from "antd"
import dayjs from "dayjs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as Tt,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"

const Temperature: React.FC = () => {
  const [temperatures, setTemperatures] = useState([])
  const [threshold, setThreshold] = useState<any>()
  const [thresholdData, setThresholdData] = useState<any>()
  const [showModal, setShowModal] = useState(false)

  const loadThreshold = async () => {
    const thresholds = await TemperatureService.getThreshold()
    if (thresholds.length > 0) {
      //@ts-ignore
      setThresholdData(thresholds[0])
    }
  }

  useEffect(() => {
    const formatData = (data: any) => {
      return data.filter((item : any) => !String(item.temperature).startsWith("-127"))
      .map((item: any) => ({
        temperature: parseFloat(item.temperature).toFixed(2),
        time: dayjs(item.createdAt).format("DD-MM-YYYY HH:mm"),
      }))
    }

    const load = async () => {
      try {
        const temperatureData = await TemperatureService.getTemperatureData()
        console.log("Temperatures: ", formatData(temperatureData))
        setTemperatures(formatData(temperatureData))
        loadThreshold()
      } catch (error) {
        message.error("Lỗi! Vui lòng thử lại sau!")
      }
    }

    // Xử lý sự kiện nhận từ WebSocket
    const handleTemperatureUpdate = (updatedTemperatures: any) => {
      setTemperatures(formatData(updatedTemperatures))
    }

    // Tải dữ liệu ban đầu
    load()

    // Kết nối WebSocket và lắng nghe sự kiện
    on("updateTemperature", handleTemperatureUpdate)

    // Cleanup khi component unmount
    return () => {
      off("updateTemperature", handleTemperatureUpdate) // Ngừng lắng nghe sự kiện
    }
  }, [])

  const handleSetThreshold = async () => {
    try {
      await TemperatureService.setThreshold(threshold.min, threshold.max)
      await loadThreshold()
      message.success("Đã cập nhật ngưỡng nhiệt độ an toàn cho bể!")
    } catch (error) {
      //@ts-ignore
      message.error(error.message)
    } finally {
      setShowModal(false)
    }
  }
  const onChangeThresholdMin: InputNumberProps["onChange"] = (value) => {
    setThreshold({ ...threshold, min: value })
  }
  const onChangeThresholdMax: InputNumberProps["onChange"] = (value) => {
    setThreshold({ ...threshold, max: value })
  }

  const temp = thresholdData ? `${thresholdData.min}-${thresholdData.max}` : "-"
  return (
    <div className="flex flex-col justify-center bg-slate-100 rounded-md">
      <div className="text-xl self-end font-bold p-3">
        <span>
          <FontAwesomeIcon icon={faTemperatureThreeQuarters} className="px-1" />
          Nhiệt độ an toàn:{" "}
        </span>
        {temp}&deg;C
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={temperatures}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis dataKey="temperature" />
          <Tt />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#F95454"
            activeDot={{ r: 0 }}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <Tooltip
        placement="leftBottom"
        title={"Đặt ngưỡng nhiệt độ an toàn cho bể cá!"}
      >
        <FloatButton
          icon={<FontAwesomeIcon icon={faAdd} />}
          style={{
            insetInlineEnd: 24,
            boxShadow: "0 0 10px 0 rgba(0,0,0,0.3)",
          }}
          onClick={() => {
            setShowModal(true)
          }}
        />
      </Tooltip>
      <Modal
        title="Ngưỡng nhiệt độ cho bể cá"
        open={showModal}
        onCancel={() => {
          setShowModal(false)
        }}
        onOk={handleSetThreshold}
      >
        <FontAwesomeIcon
          icon={faTemperatureThreeQuarters}
          className="px-1 mr-2 text-xl"
        />
        <InputNumber
          min={-10}
          max={50}
          defaultValue={thresholdData ? thresholdData.min : 0}
          onChange={onChangeThresholdMin}
          changeOnWheel
          className="mr-2"
        />
        <span>-</span>
        <InputNumber
          min={0}
          max={70}
          defaultValue={thresholdData ? thresholdData.max : 30}
          onChange={onChangeThresholdMax}
          changeOnWheel
          className="mx-2"
        />
        <span>&deg;C</span>
      </Modal>
    </div>
  )
}

export default Temperature
