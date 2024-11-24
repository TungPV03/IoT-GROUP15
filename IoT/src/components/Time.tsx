import {
  Switch,
  App,
  Button,
  Form,
  FormProps,
  Modal,
  TimePicker,
  FloatButton,
  Tooltip,
  Checkbox,
} from "antd"
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import styled from "styled-components"
import dayjs from "dayjs"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faAdd } from "@fortawesome/free-solid-svg-icons"
import Loading from "./Loading"
import FeedTimeService from "../axios/service/feedTime"
import { on, off } from "../axios/service/realtimeService"
import AuthService from "../axios/service/auth"
const format = "HH:mm"

const TimeContainer: React.FC<{
  setIsAuth: Dispatch<SetStateAction<boolean>>
}> = ({ setIsAuth }) => {
  const [times, setTimes] = useState<any>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createMode, setCreateMode] = useState(false)
  const [currentTime, setCurrentTime] = useState()
  const [loading, setLoading] = useState(true)

  const { message } = App.useApp()

  useEffect(() => {
    const load = async () => {
      try {
        const timeList = await FeedTimeService.getTimeList()
        timeList?.sort(
          (a: any, b: any) =>
            dayjs(a.feedTime, format).unix() - dayjs(b.feedTime, format).unix()
        )
        setTimes(timeList)
        console.log("Initial Feed Times:", timeList)
      } catch (err: any) {
        if (err.response?.status === 401) {
          AuthService.logout()
          setIsAuth(false)
        } else {
          message.error(err.message || "Đã xảy ra lỗi, vui lòng thử lại!")
        }
        console.error("Error fetching feed times:", err)
      } finally {
        setLoading(false)
      }
    }

    const handleUpdatedTimes = (updatedTimes: any) => {
      console.log("Updated Feed Times:", updatedTimes)
      const sortedTimes = updatedTimes?.sort(
        (a: any, b: any) =>
          dayjs(a.feedTime, format).unix() - dayjs(b.feedTime, format).unix()
      )
      setTimes(sortedTimes)
    }

    load()

    on("updateFeedTimes", handleUpdatedTimes)

    // Cleanup khi component unmount
    return () => {
      off("updateFeedTimes", handleUpdatedTimes) // Ngắt lắng nghe sự kiện
    }
  }, [])

  const onAddTime = () => {
    setIsModalOpen(true)
    setCreateMode(true)
  }

  if (loading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Loading />
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-5">
      {times?.map((time: any) => {
        return (
          <Time
            key={time.id + time.feedTime}
            time={time}
            setCreateMode={setCreateMode}
            setIsModalOpen={setIsModalOpen}
            setCurrentTime={setCurrentTime}
          />
        )
      })}
      <Tooltip placement="leftBottom" title={"Thêm giờ cho ăn mới!"}>
        <FloatButton
          icon={<FontAwesomeIcon icon={faAdd} />}
          style={{
            insetInlineEnd: 24,
            boxShadow: "0 0 10px 0 rgba(0,0,0,0.3)",
          }}
          onClick={onAddTime}
        />
      </Tooltip>
      <TimeForm
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        data={createMode ? undefined : currentTime}
        createMode={createMode}
      />
    </div>
  )
}

export const Time: React.FC<{
  time: any
  setIsModalOpen: Dispatch<SetStateAction<boolean>>
  setCreateMode: Dispatch<SetStateAction<boolean>>
  setCurrentTime: Dispatch<SetStateAction<any>>
}> = ({ time, setCreateMode, setIsModalOpen, setCurrentTime }) => {
  const onToggle = async (checked: boolean) => {
    await FeedTimeService.update(
      time._id,
      time.feedTime,
      time.repeadtDaily,
      checked
    )
    console.log(checked)
  }

  const onTimeClick = () => {
    setCurrentTime(time)
    setIsModalOpen(true)
    setCreateMode(false)
    console.log("TIME: ", time)
  }

  return (
    <>
      <TimeDiv>
        <span className="cursor-pointer p-4" onClick={onTimeClick}>
          {time.feedTime}
          <Repeat>{time.repeatDaily && "Lặp lại"}</Repeat>
        </span>
        <div className="mr-3">
          <Switch onChange={onToggle} defaultChecked value={time.active}/>
        </div>
      </TimeDiv>
    </>
  )
}

// -------------------------FORM--------------------------------

type FieldType = {
  time: any
  active?: boolean
  repeatDaily?: boolean
}

const TimeForm: React.FC<{
  data?: any
  isModalOpen: boolean
  setIsModalOpen: Dispatch<SetStateAction<boolean>>
  createMode: boolean
}> = ({ data, isModalOpen, setIsModalOpen, createMode }) => {
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()
  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        time: dayjs(data.feedTime, format),
        active: data.active,
        repeatDaily: data.repeatDaily,
      })
    } else {
      form.setFieldsValue({
        time: dayjs(dayjs(), format),
        active: true,
        repeatDaily: false,
      })
    }
  }, [data])

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      const formattedTime = dayjs(values.time).format("HH:mm")
      debugger
      if (data?._id) {
        await FeedTimeService.update(
          data._id,
          formattedTime,
          values.repeatDaily,
          values.active
        )
        message.success("Cập nhật thành công!")
      } else {
        await FeedTimeService.create(formattedTime, values.repeatDaily)
        message.success("Tạo mới thành công!")
      }
      form.resetFields()
    } catch (e) {
      console.error(e)

      modal.error({
        title: "Thất bại",
        content:
          "Đã có lỗi xảy ra khi thực hiện hành động, vui lòng thử lại sau!",
      })
    } finally {
      setIsModalOpen(false)
    }
  }

  const onCloseForm = () => {
    setIsModalOpen(false)
    form.resetFields()
  }

  const onToggle = (checked: boolean) => {
    console.log(checked)
  }

  const onDeleteTime = async () => {
    try {
      await FeedTimeService.delete(data._id)
      message.success("Xóa thành công!")
      form.resetFields()
    } catch (error) {
      modal.error({
        title: "Thất bại",
        content:
          "Đã có lỗi xảy ra khi thực hiện hành động, vui lòng thử lại sau!",
      })
    } finally {
      setIsModalOpen(false)
    }
  }

  return (
    <Modal
      title={"TIME FORM"}
      open={isModalOpen}
      onCancel={onCloseForm}
      footer={null}
      className="mt-10"
    >
      <Form
        form={form}
        name="basic"
        labelCol={{ span: 5, style: { textAlign: "left" } }}
        wrapperCol={{ span: 20 }}
        style={{ maxWidth: 500 }}
        onFinish={onFinish}
        autoComplete="off"
        className="mt-8 gap-3"
        layout="inline"
      >
        <Form.Item
          label="Time"
          name="time"
          rules={[{ required: true, message: "Please input time!" }]}
          labelCol={{ span: 8, offset: 4 }}
        >
          <TimePicker minuteStep={15} format={format} />
        </Form.Item>

        <Form.Item
          label="Active"
          name="active"
          labelCol={{ span: 15 }}
          className="ml-2"
        >
          <Switch onChange={onToggle} defaultChecked />
        </Form.Item>
        <Form.Item<FieldType>
          label="Repeat"
          name="repeatDaily"
          labelCol={{ span: 15 }}
          valuePropName="checked"
        >
          <Checkbox className="ml-2" />
        </Form.Item>

        <Form.Item className="flex w-full items-center justify-center mt-4">
          <div className="flex w-full items-center justify-between gap-4">
            <Button type="primary" htmlType="submit">
              Xác Nhận
            </Button>
            {!createMode && (
              <Button danger htmlType="button" onClick={onDeleteTime}>
                Xoá
              </Button>
            )}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}

const TimeDiv = styled.div`
  width: 300px;
  border-radius: 10px;
  font-size: 32px;
  font-family: "Orbitron", sans-serif;
  font-weight: 700;
  letter-spacing: 5px;
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f6f7;
`

const Repeat = styled.span`
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 1px;
  color: #777777;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  margin-left: 5px;
`
export default TimeContainer
