import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Button, Card, Space, Typography, message } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined, ReloadOutlined } from '@ant-design/icons'
import { getCaptcha } from '../api/captcha'
import { login } from '../api/auth'
import { getCurrentUser } from '../api/users'
import { useAuthStore } from '../store/auth'
import type { CaptchaRead } from '../types'

const { Title, Text } = Typography

export default function LoginPage() {
  const [form] = Form.useForm()
  const [captcha, setCaptcha] = useState<CaptchaRead | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { setToken, setUser } = useAuthStore()

  const fetchCaptcha = useCallback(async () => {
    try {
      const data = await getCaptcha()
      setCaptcha(data)
    } catch {
      // error already handled by interceptor
    }
  }, [])

  useEffect(() => {
    fetchCaptcha()
  }, [fetchCaptcha])

  const onFinish = async (values: {
    username: string
    password: string
    captcha_code: string
  }) => {
    if (!captcha) {
      message.error('请先获取验证码')
      return
    }
    setLoading(true)
    try {
      const tokenData = await login({
        username: values.username,
        password: values.password,
        captcha_key: captcha.key,
        captcha_code: values.captcha_code,
      })
      setToken(tokenData.access_token)

      // Fetch current user info
      try {
        const user = await getCurrentUser()
        setUser(user)
      } catch {
        // user info fetch failed but token is valid; proceed anyway
      }

      message.success('登录成功')

      // Redirect to the page they originally wanted, or dashboard
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch {
      // Refresh captcha on login failure
      fetchCaptcha()
      form.setFieldValue('captcha_code', '')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 420, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            Agent Platform
          </Title>
          <Text type="secondary">智能体管理平台</Text>
        </div>

        <Form form={form} onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="captcha_code"
                noStyle
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <Input prefix={<SafetyOutlined />} placeholder="验证码" />
              </Form.Item>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchCaptcha}
                title="刷新验证码"
                style={{ flexShrink: 0 }}
              />
            </Space.Compact>
          </Form.Item>

          {/* Captcha image */}
          {captcha && (
            <div
              style={{ marginBottom: 24, cursor: 'pointer', textAlign: 'center' }}
              onClick={fetchCaptcha}
              title="点击刷新验证码"
            >
              <img
                src={captcha.image}
                alt="验证码"
                style={{ height: 48, border: '1px solid #d9d9d9', borderRadius: 4 }}
              />
            </div>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
