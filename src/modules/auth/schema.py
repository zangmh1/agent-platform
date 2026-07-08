from pydantic import BaseModel

# 请求数据
# GET /api/v1/users/me
# Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
class LoginRequest(BaseModel):
    username: str
    password: str
    captcha_key: str
    captcha_code: str

# 响应数据
# {
#   "code": 200,
#   "message": "success",
#   "data": {
#     "id": 1,
#     "username": "testuser",
#     "email": "test@example.com",
#     "is_active": true
#   }
# }
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"