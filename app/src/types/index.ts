// ============ API Response Wrappers ============

export interface ResponseSchema<T> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ============ Auth ============

export interface LoginRequest {
  username: string
  password: string
  captcha_key: string
  captcha_code: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

// ============ Captcha ============

export interface CaptchaRead {
  key: string
  image: string
}

export interface CaptchaVerifyRequest {
  key: string
  code: string
}

// ============ User ============

export interface UserRead {
  id: number
  username: string
  email: string
  is_active: boolean
}

export interface UserCreate {
  username: string
  email: string
  password: string
}

export interface UserWithRolesRead extends UserRead {
  roles: RoleRead[]
}

// ============ Role ============

export interface RoleRead {
  id: number
  code: string
  name: string
  description: string | null
  permissions?: PermissionRead[]
}

export interface RoleCreate {
  code: string
  name: string
  description?: string | null
}

export interface RoleUpdate {
  name?: string | null
  description?: string | null
}

export interface RoleAssignPermissions {
  permission_ids: number[]
}

// ============ Permission ============

export interface PermissionRead {
  id: number
  code: string
  name: string
  description: string | null
}

export interface PermissionCreate {
  code: string
  name: string
  description?: string | null
}

export interface PermissionUpdate {
  name?: string | null
  description?: string | null
}
