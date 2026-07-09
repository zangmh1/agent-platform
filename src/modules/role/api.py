from src.core.deps import PageParams
from src.modules.role.schema import RoleAssignPermissions
from src.modules.permission.schema import PermissionRead
from src.core.base_schema import PageResult, ResponseSchema
from src.modules.role.schema import RoleRead
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.modules.role.schema import RoleCreate, RoleUpdate, RoleAssignPermissions

from src.modules.role.service import RoleService
from src.infra.database import get_db

router = APIRouter(prefix="/roles", tags=["Role"])

def get_role_service(db: AsyncSession = Depends(get_db)) -> RoleService:
    return RoleService(db)

# POST  /api/v1/roles   创建角色
@router.post("", response_model=ResponseSchema[RoleRead])
async def create_role(role: RoleCreate, service: RoleService = Depends(get_role_service)):
    data = await service.create_role(role)
    return ResponseSchema[RoleRead](data=RoleRead.model_validate(data))

# GET   /api/v1/roles/{role_id} 角色详情（含权限列表）
@router.get("/{role_id}", response_model=ResponseSchema[RoleRead])
async def get_role(role_id: int, service: RoleService = Depends(get_role_service)):
    data = await service.get_role(role_id)
    permissions = [PermissionRead.model_validate(p) for p in data.permissions]

    rd = RoleRead.model_validate(data)
    rd.permissions = permissions
    return ResponseSchema[RoleRead](data=rd)

# GET   /api/v1/roles   角色列表
@router.get("/", response_model=ResponseSchema[list[RoleRead]])
async def get_roles(service: RoleService = Depends(get_role_service)):
    data = await service.list_roles()
    return ResponseSchema[list[RoleRead]](data=[RoleRead.model_validate(r) for r in data])

# PUT   /api/v1/roles/{role_id} 更新角色
@router.put("/{role_id}", response_model=ResponseSchema[RoleRead])
async def update_role(role_id: int, role: RoleUpdate, service: RoleService = Depends(get_role_service)):
    data = await service.update_role(role_id, role)
    return ResponseSchema[RoleRead](data=RoleRead.model_validate(data))

# DELETE    /api/v1/roles/{role_id} 删除角色
@router.delete("/{role_id}", response_model=ResponseSchema[None])
async def delete_role(role_id: int, service: RoleService = Depends(get_role_service)):
    await service.delete_role(role_id)
    return ResponseSchema[None](data=None)

# PUT   /api/v1/roles/{role_id}/permissions 给角色分配权限
@router.put("/{role_id}/permissions", response_model=ResponseSchema[RoleRead])
async def update_role_permissions(role_id: int, role_permissions: RoleAssignPermissions, 
        service: RoleService = Depends(get_role_service)):
    data = await service.assign_permissions(role_id, role_permissions.permission_ids)
    return ResponseSchema[RoleRead](data=RoleRead.model_validate(data))

@router.get("", response_model=ResponseSchema[PageResult[RoleRead]], summary="分页查询权限列表")
async def list_roles(
    params: PageParams = Depends(),
    svc: RoleService = Depends(get_role_service),
):
    page_result = await svc.list_page_roles(params)
    # 需要把 ORM 对象转成 Pydantic 对象
    page_result.items = [RoleRead.model_validate(u) for u in page_result.items]
    return ResponseSchema(data=page_result)