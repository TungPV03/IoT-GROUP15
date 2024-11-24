import React, { useEffect, useState } from "react"
import { App, Button, Layout, Menu } from "antd"
import { Content, Footer, Header } from "antd/es/layout/layout"
import { ItemType, MenuItemType } from "antd/es/menu/interface"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faClock } from "@fortawesome/free-regular-svg-icons"
import {
  faArrowRightFromBracket,
  faClockRotateLeft,
  faTemperatureThreeQuarters,
  faMobile
} from "@fortawesome/free-solid-svg-icons"
import styled from "styled-components"
import SignIn from "./components/SignIn"
import TimeContainer from "./components/Time"
import Temperature from "./components/Temperature"
import FeedHistory from "./components/FeedHistory"
import AuthService from "./axios/service/auth"
import { connectSocket, disconnectSocket } from "./axios/service/realtimeService"
import ManageDivice from "./components/ManageDevice"

const items: ItemType<MenuItemType>[] = [
  {
    label: "Giờ cho ăn",
    icon: <FontAwesomeIcon icon={faClock} />,
    key: "time-feeder",
  },
  {
    label: "Nhiệt độ",
    icon: <FontAwesomeIcon icon={faTemperatureThreeQuarters} />,
    key: "temperature",
  },
  {
    label: "Lịch sử cho ăn",
    icon: <FontAwesomeIcon icon={faClockRotateLeft} />,
    key: "history",
  },
  {
    label: "Quản lí thiết bị",
    icon: <FontAwesomeIcon icon={faMobile} />,
    key: "manage-device",
  },
]

const MyPage: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<string>("time-feeder")
  const [isAuth, setIsAuth] = useState(false)

  const { message } = App.useApp()

  useEffect(() => {
    const authToken = localStorage.getItem("authToken")
    if (authToken) {
      setIsAuth(true)
      message.success("Chào mừng quay trở lại!")
    }
    // Kết nối WebSocket
    connectSocket()

    return () => {
      disconnectSocket() // Ngắt kết nối socket
    }
  }, [])

  const renderContent = () => {
    switch (selectedKey) {
      case "time-feeder":
        return (
          <div>
            <TimeContainer setIsAuth={setIsAuth} />
          </div>
        )
      case "temperature":
        return (
          <div>
            <Temperature />
          </div>
        )
      case "history":
        return (
          <div>
            <FeedHistory />
          </div>
        )
        case "manage-device":
          return (
            <div>
              <ManageDivice />
            </div>
          )
      default:
        return <div>Đây là nội dung cho giờ cho ăn</div>
    }
  }

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      setIsAuth(false)
      message.success("Đã đăng xuất!")
    } catch (err) {
      message.error("Đã xảy ra lỗi!")
      console.error(err)
    }
  }

  return (
    <Layout className="h-screen">
      <Header className="w-full flex items-center overflow-hidden">
        <div className="flex items-center justify-center mr-4 cursor-default">
          <span
            style={{ fontFamily: "'Modak', cursive" }}
            className="text-white text-2xl"
          >
            FAF
          </span>
        </div>
        <MenuContainer>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["time-feeder"]}
            items={items}
            style={{ flex: 1, minWidth: 0 }}
            className="flex gap-1 items-center"
            onClick={(e) => setSelectedKey(e.key)}
          />
        </MenuContainer>
        <div>
          {isAuth && (
            <Button
              type="text"
              onClick={handleLogout}
              icon={
                <FontAwesomeIcon
                  icon={faArrowRightFromBracket}
                  className="text-white text-xl"
                />
              }
            />
          )}
        </div>
      </Header>
      <Content className="py-0 px-4 sm:px-8 md:px-12 mt-4">
        {isAuth ? (
          <div className="p-6 min-h-[380px] bg-accent rounded-xl">
            {renderContent()}
          </div>
        ) : (
          <SignIn setIsAuth={setIsAuth} />
        )}
      </Content>
      <Footer className="text-center text-[12px] text-stone-400 z-10">
        IoT Fish Auto Feeder ©{new Date().getFullYear()} Created by Group 15
      </Footer>
    </Layout>
  )
}

const MyApp = () => {
  return (
    <App>
      <MyPage />
    </App>
  )
}

const MenuContainer = styled.div`
  flex-grow: 1;

  > ul {
    height: 100%;

    > li {
      font-weight: 700;
      margin: 10px 0 !important;
      display: flex !important;
      align-items: center;
      justify-content: center;
      position: relative !important;
      max-height: 50px;
      width: 150px;
      border-radius: 6px !important;
      > span {
        display: block;
        height: fit-content;
      }

      &.ant-menu-item-selected {
        background-color: #1e3e62 !important;
        color: #fff;
      }
    }
  }
`

export default MyApp
