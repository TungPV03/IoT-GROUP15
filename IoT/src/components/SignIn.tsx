import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import { App, Button, Checkbox, Form, FormProps, Input, Modal } from "antd"
import { Select } from "antd"
import AuthService from "../axios/service/auth"

type FieldType = {
  email?: string
  password?: string
  remember?: string
}

const SignIn: React.FC<{ setIsAuth: Dispatch<SetStateAction<boolean>> }> = ({
  setIsAuth,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [emails, setEmails] = useState<any>([])
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()
  // @ts-ignore
  const options = emails.map((item) => ({
    label: item.email,
    value: item.email,
  }))

  useEffect(() => {
    const load = async () => {
      try {
        const data = await AuthService.getLoginEmails()
        setEmails(data)
      } catch (err) {
        console.error(err)
      }
    }

    load()
  }, [])

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      await AuthService.login(values.email, values.password, values.remember)
      setIsAuth(true)
      message.success("Đăng nhập thành công!")
      handleOk()
    } catch (e) {
      modal.error({
        title: "Đăng nhập thất bại",
        content: "Sai email hoặc mật khẩu. Vui lòng thử lại!",
      })
    }
  }

  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.log("Failed:", errorInfo)
  }

  const handleOk = () => {
    setIsModalOpen(false)
  }
  const onChange = (value: string) => {
    console.log(`selected ${value}`)
  }

  const onSearch = (value: string) => {
    console.log("search:", value)
  }

  const headerModal = (
    <div className="text-center font-bold text-xl w-full">
      Vui lòng đăng nhập!
    </div>
  )

  return (
    <>
      <Modal
        title={headerModal}
        open={isModalOpen}
        footer={null}
        closeIcon={null}
        className="mt-10"
      >
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 5, style: { textAlign: "left" } }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          className="flex justify-center flex-col mt-8"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Select
              showSearch
              placeholder="Chọn một email"
              optionFilterProp="label"
              onChange={onChange}
              onSearch={onSearch}
              options={options}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item<FieldType>
            name="remember"
            valuePropName="checked"
            wrapperCol={{ offset: 5, span: 16 }}
          >
            <Checkbox>Duy trì đăng nhập</Checkbox>
          </Form.Item>

          <Form.Item className="self-center">
            <Button type="primary" htmlType="submit">
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default SignIn
