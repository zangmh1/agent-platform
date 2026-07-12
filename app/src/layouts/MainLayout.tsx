import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Space, Typography, theme } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  ApiOutlined,
  BlockOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  ToolOutlined,
  RobotOutlined,
  LineChartOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import { useAuthStore } from '../store/auth'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '首页' },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: '/users', icon: <UserOutlined />, label: '用户管理' },
      { key: '/roles', icon: <TeamOutlined />, label: '角色管理' },
      { key: '/permissions', icon: <SafetyCertificateOutlined />, label: '权限管理' },
    ],
  },
  {
    type: 'group' as const,
    label: 'Agent 平台',
    children: [
      { key: '/providers', icon: <ApiOutlined />, label: '模型供应商' },
      { key: '/model-mgmt', icon: <BlockOutlined />, label: '模型管理' },
      { key: '/prompts', icon: <FileTextOutlined />, label: 'Prompt 管理' },
      { key: '/knowledge', icon: <DatabaseOutlined />, label: '知识库管理' },
      { key: '/tools', icon: <ToolOutlined />, label: '工具管理' },
      { key: '/agents', icon: <RobotOutlined />, label: 'Agent 管理' },
      { key: '/conversations', icon: <LineChartOutlined />, label: '对话日志与统计', disabled: true },
    ],
  },
]

// 根据当前路径找到选中的菜单 key（支持子菜单）
function findSelectedKey(pathname: string): string {
  // 精确匹配顶层
  const topMatch = menuItems.find((item) => item.key === pathname)
  if (topMatch) return pathname

  // 递归查找子菜单
  for (const item of menuItems) {
    if ('children' in item && item.children) {
      const child = item.children.find(
        (c) => c.key === pathname || c.key === '/' + pathname.split('/').slice(1, 3).join('/'),
      )
      if (child) return child.key
    }
  }
  return '/' + (pathname.split('/')[1] || '')
}

// 需要默认展开的父级菜单 key
const defaultOpenKeys = ['system']

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { token: themeToken } = theme.useToken()

  const selectedKey = findSelectedKey(location.pathname)

  const handleMenuClick = (info: { key: string }) => {
    // 查找对应的菜单项，如果 disabled 则不跳转
    const findDisabled = (items: typeof menuItems): boolean => {
      for (const item of items) {
        if ('key' in item && item.key === info.key && 'disabled' in item && item.disabled === true) return true
        if ('children' in item && item.children) {
          for (const child of item.children) {
            if ('disabled' in child && child.key === info.key && child.disabled === true) return true
          }
        }
      }
      return false
    }
    if (findDisabled(menuItems)) return
    navigate(info.key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
        style={{ background: themeToken.colorBgContainer }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
          }}
        >
          <Text strong style={{ fontSize: collapsed ? 14 : 18, whiteSpace: 'nowrap' }}>
            {collapsed ? 'AP' : 'Agent Platform'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={defaultOpenKeys}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Space>
            <Text type="secondary">
              {user ? `${user.username} (${user.email})` : ''}
            </Text>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              danger
            >
              退出登录
            </Button>
          </Space>
        </Header>

        <Content
          style={{
            margin: 24,
            padding: 24,
            background: themeToken.colorBgContainer,
            borderRadius: themeToken.borderRadiusLG,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
