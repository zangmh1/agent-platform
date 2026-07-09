import client from './client'
import type { ResponseSchema, CaptchaRead, CaptchaVerifyRequest } from '../types'

export function getCaptcha(): Promise<CaptchaRead> {
  return client.get('/api/v1/captcha')
}

export function verifyCaptcha(data: CaptchaVerifyRequest): Promise<null> {
  return client.post('/api/v1/captcha/verify', data)
}
