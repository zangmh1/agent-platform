from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.infra.database import get_db
from src.core.exceptions import BizException
from src.utils.jwt_utils import verify_jwt, oauth2_scheme
from src.modules.user.model import User

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """从 JWT token 中解析当前登录用户，用于保护接口"""
    try:
        payload = verify_jwt(token)
        user_id = int(payload.get("sub"))
    except Exception:
        raise BizException(code=401, message="未登录或 token 已过期")

    user = await db.get(User, user_id)
    if not user:
        raise BizException(code=401, message="用户不存在")
    if not user.is_active:
        raise BizException(code=401, message="账号已被禁用")

    return user

def require_permission(permission_code: str):
    """检查当前登录用户是否具有指定权限"""

    async def _check(
        current_user: User = Depends(get_current_user),
    ):
        # 1. 检查用户是否是超级管理员
        if current_user.is_superuser:
            return current_user
        
        # 2. 收集此用户的所有权限
        current_user.permissions = set()
        for role in current_user.roles:
            for permission in role.permissions:
                current_user.permissions.add(permission.code)

        if permission not in current_user.permissions:
            raise BizException(code=403, message="没有权限访问该资源")
        
        return current_user

    return _check

from fastapi import Query

class PageParams:
    """通用分页参数，通过 Depends 注入到接口中"""
    def __init__(
        self,
        page: int = Query(1, ge=1, description="页码，从1开始"),
        page_size: int = Query(10, ge=1, le=100, description="每页条数"),
        keyword: str | None = Query(None, description="搜索关键词"),
    ):
        self.page = page
        self.page_size = page_size
        self.keyword = keyword

    @property
    def offset(self) -> int:
        """计算 SQL OFFSET"""
        return (self.page - 1) * self.page_size