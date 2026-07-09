import axios from 'axios'
import { message } from 'antd'

const client = axios.create({
  baseURL: '',  // uses Vite proxy in dev, or relative path in prod
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ---------- Request interceptor: attach token ----------
client.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage')
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      const token = parsed?.state?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // ignore parse errors
    }
  }
  return config
})

// ---------- Response interceptor: unwrap ResponseSchema ----------
client.interceptors.response.use(
  (response) => {
    const body = response.data
    // If the response follows the backend ResponseSchema pattern
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code !== 200) {
        message.error(body.message || '请求失败')
        return Promise.reject(new Error(body.message || '请求失败'))
      }
      // Unwrap: return the `data` field
      return body.data
    }
    // Otherwise return the raw response data (e.g., /health)
    return body
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage')
      message.error('登录已过期，请重新登录')
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (error.response?.status === 422) {
      const detail = error.response.data?.detail
      if (Array.isArray(detail)) {
        message.error(detail.map((d: { msg: string }) => d.msg).join('; '))
      } else {
        message.error('请求参数错误')
      }
    } else {
      message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  },
)

export default client
