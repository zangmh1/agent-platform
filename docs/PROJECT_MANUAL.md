# Agent-Platform 项目说明书

> **版本**: 1.1.0 | **最后更新**: 2026-07-09 | **环境**: Python 3.13 + FastAPI + MySQL 8.4 + Redis + React 18

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈总览](#2-技术栈总览)
3. [项目目录结构](#3-项目目录结构)
4. [架构设计](#4-架构设计)
5. [基础设施层](#5-基础设施层)
6. [核心框架层](#6-核心框架层)
7. [业务模块详解](#7-业务模块详解)
8. [数据库设计](#8-数据库设计)
9. [API 接口文档](#9-api-接口文档)
10. [认证与权限体系](#10-认证与权限体系)
11. [开发环境搭建](#11-开发环境搭建)
12. [前端项目说明](#12-前端项目说明)
13. [测试说明](#13-测试说明)
14. [扩展开发指南](#14-扩展开发指南)

---

## 1. 项目概述

### 1.1 项目定位

**Agent-Platform** 是一个面向企业内部的**大模型与智能体（Agent）集成管理基础平台**。它提供了一套完整的基础设施，包括用户管理、角色权限控制（RBAC）、验证码、JWT 认证等通用能力，后续将在此基础上扩展多模型接入、Agent 编排、对话管理等功能。

### 1.2 当前完成的功能

| 模块 | 状态 | 说明 |
|------|------|------|
| 用户管理 | ✅ 已完成 | 注册、查询、分页搜索、角色分配 |
| JWT 认证 | ✅ 已完成 | 登录/鉴权/Token 签发与验证 |
| 图片验证码 | ✅ 已完成 | 生成、Redis 存储、校验 |
| 权限管理 | ✅ 已完成 | CRUD、分页搜索 |
| 角色管理 | ✅ 已完成 | CRUD、权限分配、分页搜索 |
| RBAC 鉴权 | ✅ 已完成 | 基于角色的权限检查中间件 |
| 模型供应商 | ✅ 已完成 | CRUD、分页搜索、连接测试 |
| 模型管理 | ✅ 已完成 | CRUD、供应商关联、能力标签、价格管理 |
| Prompt管理 | ✅ 已完成 | CRUD、变量定义、版本快照、发布/回滚 |
| 知识库管理 | ✅ 已完成 | KB CRUD、文档上传/删除、分段检索/编辑 |
| 工具管理 | ✅ 已完成 | CRUD、启用/禁用、Function Calling定义、工具测试 |
| Agent管理 | ✅ 已完成 | CRUD、生命周期启停、配置管理、版本发布/回滚 |
| 前端项目 | ✅ 已完成 | React 18 + TS + Vite + Ant Design；系统管理 3 + Agent 平台 6 模块全部完成 |

### 1.3 项目命名约定

- 数据库名：`chenguang`（晨光）
- 应用名：`MyApp`（可在 `.env` 中修改 `APP_NAME`）
- 所有 ORM 模型表使用**复数蛇形命名**，如 `users`、`roles`、`permissions`
- 关联表命名：`{表1}_{表2}`，如 `user_roles`、`role_permissions`

---

## 2. 技术栈总览

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **Web 框架** | FastAPI | 0.135.1 | 异步 REST API |
| **ORM** | SQLAlchemy | 2.0.48 | 异步数据库操作 |
| **数据库驱动** | asyncmy | 0.2.11 | MySQL 异步驱动 |
| **数据库** | MySQL | 8.4 | 主数据存储 |
| **缓存** | Redis | latest | 验证码存储/缓存 |
| **数据校验** | Pydantic | 2.13.4 | 请求/响应模型验证 |
| **配置管理** | pydantic-settings | 2.14.2 | 环境变量与 .env 加载 |
| **数据库迁移** | Alembic | 1.18.5 | 数据库版本管理 |
| **密码加密** | bcrypt | (via passlib) | 密码哈希 |
| **JWT** | PyJWT | (cryptography) | Token 签发与验证 |
| **验证码** | captcha | - | 图片验证码生成 |
| **日志** | loguru | 0.7.3 | 结构化日志 |
| **容器化** | Docker Compose | - | 本地开发环境 |
| **对象存储** | MinIO | RELEASE.2025-04-22 | 文件/对象存储（已配置，暂未使用） |
| **测试** | pytest | 9.1.1 | 单元测试 |

---

## 3. 项目目录结构

```
agent-platform/
├── .env                          # 环境变量配置文件（不提交到 git）
├── .gitignore                    # Git 忽略规则
├── README.md                     # 项目简介
├── PROJECT_MANUAL.md             # 本说明书
├── requirements.txt              # Python 依赖列表
├── pyproject.toml                # PyTest 配置
├── alembic.ini                   # Alembic 数据库迁移配置
├── test.http                     # HTTP 接口测试文件（VS Code REST Client）
│
├── alembic/                      # 数据库迁移目录
│   ├── env.py                    # Alembic 环境配置（自动读取 Settings）
│   ├── script.py.mako            # 迁移文件模板
│   └── versions/                 # 迁移版本文件
│       ├── 88c7443f23a0_init.py
│       ├── a8ce183b1971_users.py
│       ├── 468886325a30_新增users表.py
│       ├── e85069585091_修改用户模型_基础版.py
│       ├── 5e9170cf52e0_修改用户模型_最后登录时间.py
│       ├── d331acd2dc14_add_roles_table.py
│       ├── 1a0e1ab36c53_描述本次变更.py
│       └── 17af2e5119a0_rbac完整模型.py     # 最终的 RBAC 完整模型
│
├── docker/                       # Docker 容器化配置
│   ├── docker-compose.yaml       # MySQL + Redis + MinIO 编排文件
│   └── docker/                   # 容器数据卷目录
│       ├── mysql/                # MySQL 数据文件
│       │   ├── init/             # 初始化 SQL 脚本
│       │   └── data/             # 持久化数据
│       ├── redis_data/           # Redis 持久化数据
│       └── minio_data/           # MinIO 持久化数据
│
├── src/                          # 后端源码（主工作区）
│   ├── __init__.py
│   ├── main.py                   # FastAPI 应用入口，路由注册
│   │
│   ├── core/                     # 核心框架层：可复用的基础设施
│   │   ├── config.py             # 配置管理（Settings 类，读取 .env）
│   │   ├── base_model.py         # ORM 基类（Base, BaseModel, TimestampMixin）
│   │   ├── base_repository.py    # 通用 Repository（CRUD + 分页搜索）
│   │   ├── base_schema.py        # 通用响应模型（ResponseSchema, PageResult）
│   │   ├── deps.py               # 依赖注入（获取当前用户、权限检查、分页参数）
│   │   ├── exceptions.py         # 全局异常处理（BizException）
│   │   └── logger.py             # 日志配置（loguru 控制台 + 文件）
│   │
│   ├── infra/                    # 基础设施层：数据库、缓存连接
│   │   ├── database.py           # MySQL 异步引擎 + 会话工厂 + get_db 依赖
│   │   └── redis_cache.py        # Redis 连接池 + get_redis_client 依赖
│   │
│   ├── middlewares/              # 中间件
│   │   └── logging.py            # HTTP 请求/响应日志中间件
│   │
│   ├── utils/                    # 工具函数
│   │   ├── jwt_utils.py          # JWT 签发/验证 + OAuth2 Bearer 配置
│   │   ├── password_utils.py     # bcrypt 密码哈希/校验
│   │   └── async_sample.py       # 异步操作示例（待清理）
│   │
│   └── modules/                  # 业务模块（每个模块是一个独立的功能域）
│       ├── user/                 # 用户模块
│       │   ├── model.py          # User ORM 模型
│       │   ├── schema.py         # Pydantic 请求/响应模型
│       │   ├── repository.py     # UserRepository（继承 BaseRepository）
│       │   ├── service.py        # UserService（业务逻辑）
│       │   └── api.py            # API 路由（/users）
│       │
│       ├── auth/                 # 认证模块
│       │   ├── schema.py         # 登录请求/Token 响应
│       │   ├── service.py        # AuthService（验证码校验 + 密码验证 + JWT 签发）
│       │   └── api.py            # API 路由（/api/v1/auth）
│       │
│       ├── captcha/              # 验证码模块
│       │   ├── schema.py         # 验证码请求/响应
│       │   └── api.py            # API 路由（/api/v1/captcha）
│       │
│       ├── permission/           # 权限模块
│       │   ├── model.py          # Permission ORM 模型
│       │   ├── schema.py         # Pydantic 请求/响应模型
│       │   ├── repository.py     # PermissionRepository
│       │   ├── service.py        # PermissionService
│       │   └── api.py            # API 路由（/api/v1/permissions）
│       │
│       └── role/                 # 角色模块
│           ├── model.py          # Role ORM 模型 + 关联表定义
│           ├── schema.py         # Pydantic 请求/响应模型
│           ├── repository.py     # RoleRepository
│           ├── service.py        # RoleService
│           └── api.py            # API 路由（/api/v1/roles）
│       │
│       └── provider/             # 模型供应商模块
│           ├── model.py          # ModelProvider ORM 模型
│           ├── schema.py         # Pydantic 请求/响应模型
│           ├── repository.py     # ProviderRepository
│           ├── service.py        # ProviderService
│           └── api.py            # API 路由（/api/v1/providers）
│       │
│       ├── model/                # 模型管理模块
│       │   ├── model.py          # LLMModel ORM 模型
│       │   ├── schema.py         # Pydantic 请求/响应模型
│       │   ├── repository.py     # ModelRepository
│       │   ├── service.py        # ModelService（含 _to_read 映射）
│       │   └── api.py            # API 路由（/api/v1/models）
│       │
│       └── prompt/               # Prompt管理模块
│           ├── model.py          # Prompt + PromptVersion ORM 模型
│           ├── schema.py         # Pydantic 请求/响应模型（含变量定义）
│           ├── repository.py     # PromptRepository + PromptVersionRepository
│           ├── service.py        # PromptService（发布/回滚/版本管理）
│           └── api.py            # API 路由（/api/v1/prompts）
│
├── test/                         # 测试目录
│   ├── __init__.py
│   ├── test_sample.py            # 基础测试示例
│   ├── test_async_sample.py      # 异步测试示例
│   └── utils/                    # 工具函数测试
│       ├── test_jwt_utils.py     # JWT 签发/验证测试
│       └── test_password.py      # 密码哈希测试
│
└── app/                          # 前端项目目录（React 18 + TypeScript + Vite + Ant Design）
    ├── package.json              # 项目依赖与脚本
    ├── vite.config.ts            # Vite 构建配置（含 API 代理）
    ├── tsconfig.json             # TypeScript 配置
    ├── index.html                # 入口 HTML
    ├── public/vite.svg           # 网站图标
    └── src/
        ├── main.tsx              # ReactDOM 入口，Ant Design 中文配置
        ├── App.tsx               # 路由配置
        ├── api/                  # API 模块（auth, captcha, users, roles, permissions）
        ├── store/auth.ts         # Zustand 认证状态
        ├── layouts/MainLayout.tsx # 主布局（侧边栏 + 顶栏）
        ├── pages/                # 页面组件（Login, Dashboard, Users, Roles, Permissions）
        ├── components/           # 公共组件（ProtectedRoute）
        └── types/index.ts        # TypeScript 类型定义
```

---

## 4. 架构设计

### 4.1 分层架构

项目采用**经典三层架构 + 基础设施层**的设计：

```
┌──────────────────────────────────────────┐
│              API 层 (api.py)              │  ← 路由定义、参数解析、调用 Service
├──────────────────────────────────────────┤
│           服务层 (service.py)             │  ← 业务逻辑、事务编排、异常处理
├──────────────────────────────────────────┤
│          仓库层 (repository.py)           │  ← 数据访问、SQL 查询封装
├──────────────────────────────────────────┤
│          模型层 (model.py)                │  ← ORM 模型定义（SQLAlchemy）
├────────────┬────────────┬────────────────┤
│   Core     │   Infra    │   Middlewares   │  ← 横切关注点：配置、数据库、中间件
└────────────┴────────────┴────────────────┘
```

### 4.2 依赖流向

```
api.py ──Depends──▶ service.py ──调用──▶ repository.py ──操作──▶ model.py (ORM)
    │                     │                    │
    └──── Depends ────────┴──── Depends ───────┘
         (FastAPI 依赖注入链)
```

### 4.3 关键设计模式

| 模式 | 应用场景 | 实现位置 |
|------|---------|---------|
| **依赖注入** | DB 会话、Redis、当前用户、权限检查 | `deps.py`, `database.py`, `redis_cache.py` |
| **Repository 模式** | 封装数据库操作 | `base_repository.py` → 各模块 `repository.py` |
| **Service 模式** | 封装业务逻辑 | 各模块 `service.py` |
| **单一配置源** | .env → Settings → 全应用 | `config.py` 的 `get_settings()` 单例 |
| **泛型基类** | 通用 CRUD、通用响应格式 | `BaseRepository[T]`, `ResponseSchema[T]` |

### 4.4 请求处理流程图

```
HTTP Request
    │
    ▼
LoggingMiddleware（记录请求方法、路径、耗时）
    │
    ▼
FastAPI Router（路由匹配）
    │
    ▼
Depends 链：get_db → get_current_user → require_permission
    │
    ▼
API 函数（参数校验 + 调用 Service）
    │
    ▼
Service（业务逻辑 + 调用 Repository + 事务管理）
    │
    ▼
Repository（执行 SQL → 返回 ORM 对象）
    │
    ▼
Pydantic Serialization（ORM → JSON Response）
    │
    ▼
ResponseSchema { code, message, data }
    │
    ▼
HTTP Response (JSON)
```

---

## 5. 基础设施层

### 5.1 数据库连接（`src/infra/database.py`）

```python
# 异步引擎配置
engine = create_async_engine(
    settings.DATABASE_URL,        # mysql+asyncmy://user:pass@host:port/db?charset=utf8mb4
    echo=settings.APP_DEBUG,      # 开发时打印 SQL
    pool_size=10,                 # 连接池大小
    max_overflow=20,              # 最大溢出连接
    pool_recycle=3600,           # 连接回收时间（秒）
    pool_pre_ping=True,          # 连接前 ping 检测
)

# get_db() 是 FastAPI 的 Depends 注入函数
# 自动处理 commit / rollback
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()      # 请求成功 → 提交
        except Exception:
            await session.rollback()    # 请求失败 → 回滚
            raise
```

### 5.2 Redis 连接（`src/infra/redis_cache.py`）

```python
# 模块级别的连接池 + 客户端实例（单例模式）
redis_pool = redis.ConnectionPool(host=..., port=..., password=..., decode_responses=True)
_redis_client = redis.Redis(connection_pool=redis_pool)

# get_redis_client() 用于 FastAPI Depends 注入
```

Redis 目前仅用于**验证码存储**（key: `captcha:{uuid}`，TTL: 300秒），后续可扩展用于缓存、会话管理等。

### 5.3 Docker 环境（`docker/docker-compose.yaml`）

编排了三个基础服务：

| 服务 | 镜像 | 端口 | 凭证 |
|------|------|------|------|
| MySQL 8.4 | `mysql:8.4` | 3306 | root / 123456 |
| Redis | `redis:latest` | 6379 | 密码: 123456 |
| MinIO | `minio/minio:RELEASE.2025-04-22` | 9000 (API), 9001 (Console) | minioadmin / minioadmin123 |

启动命令：`docker compose -f docker/docker-compose.yaml up -d`

---

## 6. 核心框架层

### 6.1 配置管理（`src/core/config.py`）

```python
class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "MyApp"       # 应用名称
    APP_ENV: str = "development"  # 环境标识（dev / prod）
    APP_DEBUG: bool = True        # 调试模式

    # 数据库配置
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "myapp"

    # Redis 配置
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0

    # 日志配置
    LOG_LEVEL: str = "DEBUG"
    LOG_DIR: str = "logs"

    # 自动从 .env 文件读取
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+asyncmy://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

# 单例（LRU 缓存，整个进程只有一份 Settings 实例）
@lru_cache
def get_settings() -> Settings:
    return Settings()
```

**关键点**：
- `DATABASE_URL` 是计算属性，基于字段自动拼接，不会出现在 `.env` 中
- `get_settings()` 使用 `lru_cache` 实现单例，全应用多次调用返回同一实例
- 环境变量优先级：系统环境变量 > `.env` 文件 > 默认值

### 6.2 ORM 基类（`src/core/base_model.py`）

```python
class Base(DeclarativeBase):
    """所有模型的元数据注册基类"""
    pass

class TimestampMixin:
    """自动维护 created_at / updated_at（由数据库 server_default 实现）"""
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class BaseModel(Base, TimestampMixin):
    """所有业务表继承此类，自动获得 id + 时间戳字段"""
    __abstract__ = True
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
```

**继承关系**：
```
Base → BaseModel(id, created_at, updated_at) → User / Role / Permission
```

### 6.3 通用 Repository（`src/core/base_repository.py`）

这是一个**泛型基类** `BaseRepository[T]`，提供标准的数据库操作方法：

| 方法 | 说明 |
|------|------|
| `get_by_id(id)` | 按主键查询单条 |
| `get_by_ids(ids)` | 按 ID 列表批量查询 |
| `get_all(offset, limit)` | 全量查询（带偏移限制） |
| `create(obj)` | 新增 → flush + refresh |
| `update(obj)` | 更新 → flush + refresh |
| `delete(obj)` | 删除 → flush |
| `get_page(offset, limit, keyword, search_fields)` | **通用分页 + 模糊搜索** |

`get_page` 方法是项目的核心分页逻辑：
- 支持 `keyword` 在多个字段上进行 OR 模糊匹配（`LIKE %keyword%`）
- 返回 `(数据列表, 总条数)` 元组
- 按 `id DESC` 倒序排列

### 6.4 通用响应格式（`src/core/base_schema.py`）

所有 API 统一使用以下格式：

```json
{
    "code": 200,
    "message": "success",
    "data": { ... }
}
```

```python
class ResponseSchema(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None

class PageResult(BaseModel, Generic[T]):
    items: list[T] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
```

### 6.5 依赖注入（`src/core/deps.py`）

| 依赖函数 | 用途 | 使用场景 |
|---------|------|---------|
| `get_current_user` | 从 JWT Token 解析当前登录用户 | 需要登录的接口 |
| `require_permission(code)` | 检查用户是否拥有指定权限 | 需要特定权限的接口（RBAC） |
| `PageParams` | 解析分页查询参数 | 分页列表接口 |

**权限检查流程**：
1. 如果用户是 `is_superuser=True`，直接放行
2. 否则，遍历该用户的所有角色 → 收集所有权限 code
3. 判断目标权限 code 是否在集合中

```python
# 使用示例
@router.get("/admin")
async def admin_only(
    current_user: User = Depends(require_permission("admin:access"))
):
    return {"message": "管理员可见"}
```

### 6.6 全局异常处理（`src/core/exceptions.py`）

```python
class BizException(Exception):
    """业务异常，code 和 message 直接返回给前端"""
    def __init__(self, code: int = 400, message: str = "业务异常"):
        self.code = code
        self.message = message
```

- `BizException` → HTTP 200，响应体 `{"code": exc.code, "message": exc.message}`
- `Exception`（其他未处理异常）→ HTTP 500，响应体 `{"code": 500, "message": "服务器内部错误"}`
- **设计意图**：业务异常也用 HTTP 200 返回，通过 `code` 字段区分成功与错误

### 6.7 日志系统（`src/core/logger.py`）

- 使用 **loguru** 库
- **控制台输出**：彩色格式，含时间、级别、模块、函数、行号
- **文件输出**：按天轮转（`YYYY-MM-DD.log`），保留 30 天，自动 gzip 压缩

---

## 7. 业务模块详解

### 7.1 模块文件组织规范

每个业务模块严格遵循以下文件结构：

```
modules/{模块名}/
├── model.py       # SQLAlchemy ORM 模型定义
├── schema.py      # Pydantic 请求/响应 Schema
├── repository.py  # 数据访问层（继承 BaseRepository）
├── service.py     # 业务逻辑层
└── api.py         # FastAPI 路由定义
```

### 7.2 用户模块（`modules/user/`）

**ORM 模型** (`User`)：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInteger | 主键，自增 |
| username | String(50) | 用户名，唯一索引 |
| email | String(100) | 邮箱，唯一索引 |
| hashed_password | String(255) | bcrypt 密码哈希 |
| is_active | Boolean | 是否启用（默认 True） |
| is_superuser | Boolean | 是否超级管理员（默认 False） |
| last_login | String(50) | 最后登录时间 |
| created_at | DateTime | 创建时间（数据库自动填充） |
| updated_at | DateTime | 更新时间（数据库自动维护） |
| roles | Mapped[list[Role]] | 多对多关联到 Role，通过 user_roles 表 |

**关联关系**：
```
User ──many-to-many──▶ Role（通过 user_roles 关联表）
       lazy="selectin"  → 查询用户时自动加载其角色
```

**UserRepository** 扩展方法：
- `get_by_username(username)` — 按用户名查询
- `get_by_email(email)` — 按邮箱查询
- `search_page(...)` — 分页搜索（支持 username、email 模糊搜索）

**UserService** 主要方法：
- `create_user(data)` — 创建用户（校验用户名/邮箱唯一性 → bcrypt 加密密码 → 入库）
- `get_user(user_id)` — 获取用户（不存在抛 404）
- `assign_roles(user_id, role_ids)` — 给用户分配角色（整体替换模式）
- `list_page_users(params)` — 分页查询用户

### 7.3 认证模块（`modules/auth/`）

**登录流程**：

```
1. 用户提交 { username, password, captcha_key, captcha_code }
2. AuthService.login() 执行：
   a. 校验验证码（从 Redis 读取 → 对比 → 删除）
   b. 查找用户（按 username）
   c. 校验密码（bcrypt.verify）
   d. 检查账号状态（is_active）
   e. 更新最后登录时间
   f. 签发 JWT（sub: user.id, username, email, is_superuser）
3. 返回 { access_token, token_type: "bearer" }
```

**JWT 配置**（`utils/jwt_utils.py`）：
- 算法：HS256
- 密钥：硬编码（生产环境应移至环境变量）
- 过期时间：30 分钟
- Token URL：`/api/v1/auth/login`

### 7.4 验证码模块（`modules/captcha/`）

- **生成**：随机 4 位字母+数字（已排除 O/0/I/1 等易混淆字符）
- **存储**：Redis，key 格式 `captcha:{uuid}`，TTL 300 秒
- **返回**：`{ key: "uuid", image: "data:image/png;base64,..." }`
- **校验**：不区分大小写，校验通过后立即删除（一次性）

### 7.5 权限模块（`modules/permission/`）

**ORM 模型** (`Permission`)：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInteger | 主键 |
| code | String(100) | 权限编码，唯一（如 `user:list`, `role:create`） |
| name | String(100) | 权限名称（如 "用户列表"） |
| description | String(200) | 权限描述，可空 |

**权限码命名规范**：建议使用 `{资源}:{操作}` 格式，如：
- `user:list` — 查看用户列表
- `user:create` — 创建用户
- `role:delete` — 删除角色

### 7.6 角色模块（`modules/role/`）

**ORM 模型** (`Role`)：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInteger | 主键 |
| code | String(100) | 角色编码，唯一（如 `admin`, `editor`） |
| name | String(100) | 角色名称（如 "管理员"） |
| description | String(200) | 角色描述 |
| permissions | Mapped[list[Permission]] | 多对多关联到 Permission，通过 role_permissions 表 |

**关联关系**：
```
Role ──many-to-many──▶ Permission（通过 role_permissions 关联表）
       lazy="selectin"  → 查询角色时自动加载其权限
```

**两个关键的多对多关联表**均定义在 `modules/role/model.py` 中：

```python
# 角色-权限关联表
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", BigInteger, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", BigInteger, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

# 用户-角色关联表
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", BigInteger, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)
```

⚠️ **注意**：两个关联表都在 `role/model.py` 中定义，但 `user_roles` 被 `user/model.py` 引用。这是因为 SQLAlchemy 要求 `secondary` 引用的 Table 必须在关联定义之前创建。

### 7.7 模型供应商模块（`modules/provider/`）

**ORM 模型** (`ModelProvider`)：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInteger | 主键 |
| name | String(100) | 供应商名称（唯一） |
| type | String(50) | 供应商类型：openai/anthropic/aliyun/azure/local/custom |
| status | String(50) | 连接状态：connected/disconnected/error（默认 disconnected） |
| endpoint | String(500) | API 端点地址 |
| api_key | Text | API 密钥（加密存储，可空） |
| description | String(500) | 供应商描述 |

**ProviderService** 主要方法：
- `create_provider(data)` — 创建供应商（名称唯一校验 → 状态默认 disconnected → 入库）
- `list_providers(params)` — 分页查询（支持 name、type 模糊搜索）
- `get_provider(provider_id)` — 获取供应商详情
- `update_provider(provider_id, data)` — 部分更新（只更新非 None 字段）
- `delete_provider(provider_id)` — 删除供应商
- `test_connection(provider_id)` — 测试连接（成功状态→connected，失败→error）

**前端页面** (`app/src/pages/providers/ProviderListPage.tsx`)：
- 分页表格 + 搜索（名称/类型）
- 创建/编辑弹窗（名称、类型下拉、端点 URL、API 密钥、描述）
- 删除确认
- 测试连接按钮（调用 `POST /api/v1/providers/{id}/test`，弹窗展示结果）
- 状态标签：已连接（绿色）、未连接（灰色）、连接失败（红色）
- 关联模型计数展示

### 7.8 模型管理模块（`modules/model/`）

**ORM 模型** (`LLMModel`)：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInteger | 主键 |
| name | String(100) | 模型显示名称 |
| model_id | String(100) | 模型标识符（如 gpt-4），唯一 |
| provider_id | BigInteger | FK → model_providers.id（CASCADE） |
| capabilities | String(500) | 能力标签，逗号分隔：function_call,vision,streaming |
| context_length | Integer | 上下文窗口大小（默认 4096） |
| status | String(50) | 状态：available/unavailable/rate_limited |
| input_price | Numeric(10,6) | 输入价格/1K tokens |
| output_price | Numeric(10,6) | 输出价格/1K tokens |
| currency | String(10) | 货币单位（默认 USD） |
| is_default | Boolean | 是否为默认模型 |
| description | Text | 模型描述 |

**核心设计点**：
- `provider` relationship（selectin 懒加载）→ 通过 `model.provider.name` 获取供应商名称
- `_to_read()` 方法：ORM → Schema 转换，处理 capabilities 逗号分隔 → 列表、浮点数精度
- 默认模型唯一性：设置 is_default 时自动取消已有的默认模型

**前端页面** (`app/src/pages/models/ModelListPage.tsx`)：
- 分页表格 + 按供应商筛选下拉 + 关键字搜索
- 创建/编辑弹窗：模型名称/标识、供应商选择、能力标签（checkbox）、上下文长度、输入/输出价格、货币、默认模型开关
- 价格显示：绿色输入价 / 黄色输出价 /1K tokens
- 状态标签：可用（绿）、不可用（灰）、限速（橙）
- 默认模型星标标识

### 7.9 Prompt管理模块（`modules/prompt/`）

**双表设计**（版本快照模式）：

| 表 | 说明 |
|------|------|
| `prompts` | 主表：当前版本的内容、变量、状态 |
| `prompt_versions` | 版本表：每次发布时的内容快照、变更说明、发布者 |

**Prompt 主表** (`Prompt`)：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInteger | 主键 |
| name | String(200) | Prompt 名称 |
| description | String(500) | 描述 |
| category | String(50) | 分类（general/chat/code/analysis/creative/system） |
| tags | JSON | 标签列表 |
| content | Text | Prompt 正文内容 |
| variables | JSON | 变量定义（name/type/description/default/required） |
| version | String(50) | 当前版本号（如 v0.1） |
| status | String(50) | 状态：draft/published |
| created_by | String(100) | 创建者 |

**PromptVersion 版本表** (`PromptVersion`)：

| 字段 | 类型 | 说明 |
|------|------|------|
| prompt_id | BigInteger | FK → prompts.id（CASCADE） |
| version | String(50) | 版本号 |
| content | Text | 该版本的完整内容快照 |
| changelog | String(500) | 变更说明 |
| is_current | Boolean | 是否为当前版本 |
| published_by | String(100) | 发布者 |
| published_at | DateTime | 发布时间 |

**核心设计点**：
- 发布流程：计算新版本号（v1.2→v1.3）→ 清除旧 is_current → 创建版本快照 → 更新主表状态
- 回滚流程：查找目标版本 → 覆盖主表 content → 更新 is_current 标记
- 变量定义使用 JSON 字段存储灵活结构（name/type/description/default_value/required）

**前端页面** (`app/src/pages/prompts/PromptListPage.tsx`)：
- 统计卡片：总数、已发布、草稿、总变量数 + 分类分布标签
- 变量定义使用 Form.List 动态增删行（变量名/类型下拉/描述/默认值/必填开关）
- 发布弹窗：当前版本+状态 Descriptions + 变更说明
- 版本历史弹窗：版本列表表格，查看内容功能（暗色代码块+变量识别），回滚按钮

### 7.10 知识库管理模块（`modules/knowledge/`）

**三层父子关系**：

```
KnowledgeBase (知识库)
    ├── Document (文档) — 1:N
    │   └── Segment (分段) — 1:N
    └── cascade 级联删除：删 KB → 删所有关联 Document + Segment
```

**核心 API**：KB CRUD + 文档上传（multipart）/列表/删除 + 分段列表/编辑/删除

**前端页面** (`app/src/pages/knowledge/KnowledgeBaseListPage.tsx`)：
- KB 表格 + CRUD：名称、状态（就绪/索引中/异常/空）、文档/分段计数、向量模型
- 点击「管理」→ 右侧 Drawer 展示详情
- Drawer 内 Tabs：文档管理 Tab（拖拽上传 + 文档列表 + 删除）+ 分段检索 Tab（搜索 + 内容编辑弹窗）
- 上传使用 Ant Design Dragger 组件
- 分段编辑弹窗：Textarea 编辑内容 + 关键词输入

### 7.11 工具管理模块（`modules/tool/`）

**ORM 模型** (`Tool`)：名称、类型（builtin/http_api/custom_function）、启用/禁用状态、JSON 配置（config + function_definition）、调用统计

**核心功能**：状态机（enable/disable）+ 工具测试（传入 JSON 参数，返回执行结果和延迟）

**前端页面** (`app/src/pages/tools/ToolListPage.tsx`)：
- 统计卡片：工具总数、已启用数、7天调用、平均成功率
- Switch 开关直接启用/禁用工具（表格内联操作）
- Function Calling 定义编辑：JSON Textarea（monospace 字体）
- 工具配置编辑：JSON Textarea
- 测试弹窗：输入 JSON 参数 → 调用 test API → 展示 Descriptions 结果（成功/失败 + 延迟 + 输出/错误）

### 7.12 Agent管理模块（`modules/agent/`）

**核心设计**：
- 聚合根模式：Agent 包含 model + prompt + RAG + tools + advanced 五个配置域
- 生命周期状态机：draft → publish → inactive → active（启停控制）
- 版本快照管理（复用 Prompt 模式）：发布时创建版本快照，支持回滚

**前端页面** (`app/src/pages/agents/AgentListPage.tsx`)：
- 统计卡片：Agent 总数、运行中、7天调用、平均成功率
- 创建/编辑弹窗内嵌 Tabs 配置编辑器（模型/提示词/RAG/工具/高级），每项为 JSON Textarea
- 关联模型下拉选择（从现有模型列表加载）
- 生命周期按钮：启动/停止（根据状态动态切换）
- 发布弹窗 + 版本历史弹窗（含回滚）
- 配置查看弹窗：Tabs 展示各配置域 JSON（暗色代码块 + 可复制）

---

## 8. 数据库设计

### 8.1 ER 图（实体关系）

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │   user_roles     │       │    roles     │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │──1:N──│ user_id (PK,FK)  │──N:1──│ id (PK)      │
│ username     │       │ role_id (PK,FK)  │       │ code         │
│ email        │       └──────────────────┘       │ name         │
│ hashed_pwd   │                                   │ description  │
│ is_active    │                                   └──────┬───────┘
│ is_superuser │                                          │
│ last_login   │                          ┌──────────────────┐
│ created_at   │                          │ role_permissions │
│ updated_at   │                          ├──────────────────┤
└──────────────┘                          │ role_id (PK,FK)  │
                                          │ permission_id    │
                                          │   (PK,FK)        │
                                          └────┬─────────────┘
                                               │
                                      ┌────────┴──────────┐
                                      │   permissions     │
                                      ├───────────────────┤
                                      │ id (PK)           │
                                      │ code              │
                                      │ name              │
                                      │ description       │
                                      └───────────────────┘
```

### 8.2 表结构汇总

| 表名 | 说明 | 主键 | 外键/关联 |
|------|------|------|----------|
| `users` | 用户表 | id (BigInteger) | - |
| `roles` | 角色表 | id (BigInteger) | - |
| `permissions` | 权限表 | id (BigInteger) | - |
| `user_roles` | 用户-角色关联表 | (user_id, role_id) 复合主键 | → users.id, roles.id (CASCADE) |
| `role_permissions` | 角色-权限关联表 | (role_id, permission_id) 复合主键 | → roles.id, permissions.id (CASCADE) |
| `model_providers` | 模型供应商表 | id (BigInteger) | → 被 models.provider_id 引用 |
| `models` | 大语言模型表 | id (BigInteger) | → models.provider_id → model_providers.id (CASCADE) |
| `prompts` | Prompt 模板表 | id (BigInteger) | → 被 prompt_versions.prompt_id 引用 |
| `prompt_versions` | Prompt 版本表 | id (BigInteger) | → prompt_versions.prompt_id → prompts.id (CASCADE) |
| `knowledge_bases` | 知识库表 | id (BigInteger) | → 被 documents.knowledge_base_id 引用 |
| `documents` | 文档表 | id (BigInteger) | → documents.knowledge_base_id → knowledge_bases.id (CASCADE) |
| `segments` | 文档分段表 | id (BigInteger) | → segments.document_id → documents.id (CASCADE) |
| `tools` | 工具表 | id (BigInteger) | — |
| `agents` | Agent 表 | id (BigInteger) | → agents.model_id → models.id (SET NULL) |
| `agent_versions` | Agent 版本表 | id (BigInteger) | → agent_versions.agent_id → agents.id (CASCADE) |

所有表都具有 `id`, `created_at`, `updated_at` 三个基础字段（来自 `BaseModel`）。

### 8.3 数据库迁移

使用 Alembic 管理数据库版本：

```bash
# 自动生成迁移文件（根据 ORM 模型变化）
alembic revision --autogenerate -m "描述本次变更"

# 升级到最新版本
alembic upgrade head

# 回滚一个版本
alembic downgrade -1

# 查看迁移历史
alembic history
```

**关键配置**：`alembic/env.py` 中通过 `get_settings()` 自动读取 `.env` 中的数据库连接信息，因此**不需要在 `alembic.ini` 中硬编码数据库连接字符串**。

---

## 9. API 接口文档

### 9.1 统一响应格式

```json
{
    "code": 200,       // 200=成功，400=业务错误，401=未登录，403=无权限，500=服务器错误
    "message": "success",
    "data": { ... }    // 具体数据，可能是对象、数组或 null
}
```

分页接口的 `data` 格式：
```json
{
    "code": 200,
    "message": "success",
    "data": {
        "items": [ ... ],
        "total": 100,
        "page": 1,
        "page_size": 10
    }
}
```

### 9.2 接口清单

#### 健康检查
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/health` | 健康检查 | 否 |

#### 认证
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/auth/login` | 用户登录 | 否（需验证码） |

#### 验证码
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/captcha` | 获取图片验证码 | 否 |
| POST | `/api/v1/captcha/verify` | 校验验证码 | 否 |

#### 用户管理
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/users` | 创建用户 | 否（注册场景） |
| GET | `/users/me` | 获取当前登录用户信息 | Bearer Token |
| GET | `/users` | 分页查询用户列表 | 否 |
| GET | `/users/{user_id}` | 获取指定用户 | 否 |
| DELETE | `/users/{user_id}` | 删除用户 | 否 |
| PUT | `/users/{user_id}/roles` | 给用户分配角色 | Bearer Token |
| GET | `/users/{user_id}/roles` | 查看用户的角色列表 | Bearer Token |

#### 权限管理
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/permissions/` | 创建权限 | Bearer Token |
| GET | `/api/v1/permissions/` | 获取所有权限列表 | Bearer Token |
| GET | `/api/v1/permissions` | 分页查询权限 | Bearer Token |
| GET | `/api/v1/permissions/{permission_id}` | 权限详情 | Bearer Token |
| PUT | `/api/v1/permissions/{permission_id}` | 更新权限 | Bearer Token |
| DELETE | `/api/v1/permissions/{permission_id}` | 删除权限 | Bearer Token |

#### 角色管理
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/roles` | 创建角色 | Bearer Token |
| GET | `/api/v1/roles/` | 获取所有角色列表 | Bearer Token |
| GET | `/api/v1/roles` | 分页查询角色 | Bearer Token |
| GET | `/api/v1/roles/{role_id}` | 角色详情（含权限列表） | Bearer Token |
| PUT | `/api/v1/roles/{role_id}` | 更新角色 | Bearer Token |
| DELETE | `/api/v1/roles/{role_id}` | 删除角色 | Bearer Token |
| PUT | `/api/v1/roles/{role_id}/permissions` | 给角色分配权限 | Bearer Token |

#### 模型供应商
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/providers` | 创建供应商 | Bearer Token |
| GET | `/api/v1/providers` | 分页查询供应商列表 | Bearer Token |
| GET | `/api/v1/providers/{provider_id}` | 供应商详情 | Bearer Token |
| PUT | `/api/v1/providers/{provider_id}` | 更新供应商 | Bearer Token |
| DELETE | `/api/v1/providers/{provider_id}` | 删除供应商 | Bearer Token |
| POST | `/api/v1/providers/{provider_id}/test` | 测试连接 | Bearer Token |

#### 模型管理
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/models` | 添加模型 | Bearer Token |
| GET | `/api/v1/models` | 分页查询模型（支持provider_id筛选） | Bearer Token |
| GET | `/api/v1/models/{model_id}` | 模型详情 | Bearer Token |
| PUT | `/api/v1/models/{model_id}` | 更新模型 | Bearer Token |
| DELETE | `/api/v1/models/{model_id}` | 删除模型 | Bearer Token |

#### Prompt管理
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/prompts` | 创建 Prompt | Bearer Token |
| GET | `/api/v1/prompts` | 分页查询 Prompt | Bearer Token |
| GET | `/api/v1/prompts/{prompt_id}` | Prompt 详情 | Bearer Token |
| PUT | `/api/v1/prompts/{prompt_id}` | 更新 Prompt | Bearer Token |
| DELETE | `/api/v1/prompts/{prompt_id}` | 删除 Prompt | Bearer Token |
| POST | `/api/v1/prompts/{prompt_id}/publish` | 发布新版本 | Bearer Token |
| GET | `/api/v1/prompts/{prompt_id}/versions` | 版本历史列表 | Bearer Token |
| POST | `/api/v1/prompts/{prompt_id}/rollback` | 回滚到指定版本 | Bearer Token |

#### 知识库管理
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/knowledge-bases` | 创建知识库 | Bearer Token |
| GET | `/api/v1/knowledge-bases` | 分页查询知识库列表 | Bearer Token |
| GET | `/api/v1/knowledge-bases/{kb_id}` | 知识库详情 | Bearer Token |
| PUT | `/api/v1/knowledge-bases/{kb_id}` | 更新知识库 | Bearer Token |
| DELETE | `/api/v1/knowledge-bases/{kb_id}` | 删除知识库（级联删除文档/分段） | Bearer Token |
| POST | `/api/v1/knowledge-bases/{kb_id}/documents` | 上传文档（multipart） | Bearer Token |
| GET | `/api/v1/knowledge-bases/{kb_id}/documents` | 文档列表 | Bearer Token |
| DELETE | `/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}` | 删除文档 | Bearer Token |
| GET | `/api/v1/knowledge-bases/{kb_id}/segments` | 分段列表 | Bearer Token |
| PUT | `/api/v1/knowledge-bases/{kb_id}/segments/{seg_id}` | 编辑分段内容 | Bearer Token |
| DELETE | `/api/v1/knowledge-bases/{kb_id}/segments/{seg_id}` | 删除分段 | Bearer Token |

#### 工具管理
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/tools` | 注册工具 | Bearer Token |
| GET | `/api/v1/tools` | 分页查询工具列表 | Bearer Token |
| GET | `/api/v1/tools/{tool_id}` | 工具详情 | Bearer Token |
| PUT | `/api/v1/tools/{tool_id}` | 更新工具 | Bearer Token |
| DELETE | `/api/v1/tools/{tool_id}` | 删除工具 | Bearer Token |
| POST | `/api/v1/tools/{tool_id}/enable` | 启用工具 | Bearer Token |
| POST | `/api/v1/tools/{tool_id}/disable` | 禁用工具 | Bearer Token |
| POST | `/api/v1/tools/{tool_id}/test` | 测试工具（传入 JSON 参数） | Bearer Token |

#### Agent管理
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/agents` | 创建 Agent | Bearer Token |
| GET | `/api/v1/agents` | 分页查询 Agent 列表 | Bearer Token |
| GET | `/api/v1/agents/{agent_id}` | Agent 详情 | Bearer Token |
| PUT | `/api/v1/agents/{agent_id}` | 更新 Agent | Bearer Token |
| DELETE | `/api/v1/agents/{agent_id}` | 删除 Agent | Bearer Token |
| POST | `/api/v1/agents/{agent_id}/start` | 启动 Agent | Bearer Token |
| POST | `/api/v1/agents/{agent_id}/stop` | 停止 Agent | Bearer Token |
| POST | `/api/v1/agents/{agent_id}/publish` | 发布版本 | Bearer Token |
| GET | `/api/v1/agents/{agent_id}/versions` | 版本列表 | Bearer Token |
| POST | `/api/v1/agents/{agent_id}/rollback` | 回滚到指定版本 | Bearer Token |

### 9.3 请求/响应示例

**登录**：
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
    "username": "zhangsan",
    "password": "123456",
    "captcha_key": "550e8400-e29b-41d4-a716-446655440000",
    "captcha_code": "A3BX"
}

# 响应
{
    "code": 200,
    "message": "success",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "token_type": "bearer"
    }
}
```

**分页查询用户**：
```bash
GET /users?page=1&page_size=10&keyword=zhang

# 响应
{
    "code": 200,
    "message": "success",
    "data": {
        "items": [
            {"id": 1, "username": "zhangsan", "email": "zhangsan@example.com", "is_active": true}
        ],
        "total": 1,
        "page": 1,
        "page_size": 10
    }
}
```

---

## 10. 认证与权限体系

### 10.1 认证流程

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ 获取验证码 │ ──▶ │ 提交登录  │ ──▶ │ 验证身份  │ ──▶ │ 签发 JWT │
│GET captcha│     │POST login│     │ AuthSvc  │     │ encode   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                        │
                              ┌──────────────────────────┘
                              ▼
                     ┌──────────────┐
                     │ 后续请求携带   │
                     │ Authorization │
                     │ Bearer <token>│
                     └──────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
     ┌────────────────┐         ┌──────────────────┐
     │ get_current_user│         │require_permission│
     │ 解析 Token → 用户│         │ 检查用户权限集合   │
     └────────────────┘         └──────────────────┘
```

### 10.2 权限模型（RBAC）

```
用户 (User) ──N:M──▶ 角色 (Role) ──N:M──▶ 权限 (Permission)
```

- **用户 ↔ 角色**：通过 `user_roles` 关联表，一个用户可以有多个角色
- **角色 ↔ 权限**：通过 `role_permissions` 关联表，一个角色可以有多个权限
- **超级管理员**：`is_superuser=True` 的用户自动拥有所有权限
- **权限检查**：使用 `Depends(require_permission("权限码"))` 装饰接口

### 10.3 添加权限保护的示例

```python
@router.get("/admin/dashboard")
async def admin_dashboard(
    current_user: User = Depends(require_permission("admin:dashboard"))
):
    return {"message": "管理员仪表盘"}
```

---

## 11. 开发环境搭建

### 11.1 前置条件

- Python 3.13+
- Docker & Docker Compose
- Node.js（为前端开发准备）

### 11.2 启动步骤

```bash
# 1. 克隆项目
git clone <repo-url>
cd agent-platform

# 2. 启动基础服务（MySQL + Redis + MinIO）
docker compose -f docker/docker-compose.yaml up -d

# 3. 创建 Python 虚拟环境
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 4. 安装依赖
pip install -r requirements.txt

# 5. 检查 .env 配置（确保数据库连接信息与 Docker 一致）
cat .env

# 6. 运行数据库迁移
alembic upgrade head

# 7. 启动 FastAPI 开发服务器
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# 8. 验证
curl http://127.0.0.1:8000/health
# 返回: {"message": "Hellow World!"}
```

### 11.3 FastAPI 自动文档

启动后访问：
- Swagger UI：`http://127.0.0.1:8000/docs`
- ReDoc：`http://127.0.0.1:8000/redoc`

---

## 12. 前端项目说明

### 12.1 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | React | 18.x | UI 组件框架 |
| 构建 | Vite | 5.x | 开发服务器 + 生产构建 |
| UI 库 | Ant Design | 5.x | 企业级 UI 组件库 |
| 图标 | @ant-design/icons | 5.x | Ant Design 图标库 |
| 路由 | React Router | 6.x | SPA 客户端路由 |
| HTTP | Axios | 1.x | HTTP 请求 + 拦截器 |
| 状态管理 | Zustand | 5.x | 轻量级状态管理 |

### 12.2 目录结构

```
app/
├── package.json                    # 项目依赖与脚本
├── vite.config.ts                  # Vite 构建配置（含 API 代理）
├── tsconfig.json                   # TypeScript 编译配置
├── index.html                      # 入口 HTML
├── public/
│   └── vite.svg                    # 网站图标
└── src/
    ├── main.tsx                    # ReactDOM 入口，挂载 Ant Design ConfigProvider（中文）
    ├── App.tsx                     # 路由配置：公开路由 + 受保护路由
    ├── vite-env.d.ts               # Vite 类型声明
    ├── api/                        # API 模块（按后端模块划分）
    │   ├── client.ts               # Axios 实例 + 请求/响应拦截器
    │   ├── auth.ts                 # POST /api/v1/auth/login
    │   ├── captcha.ts              # GET /api/v1/captcha, POST /api/v1/captcha/verify
    │   ├── users.ts                # 用户 CRUD + 角色分配
    │   ├── roles.ts                # 角色 CRUD + 权限分配
    │   └── permissions.ts          # 权限 CRUD
    ├── store/
    │   └── auth.ts                 # Zustand 认证状态（token + 用户信息，持久化到 localStorage）
    ├── layouts/
    │   └── MainLayout.tsx          # 主布局：侧边栏 + 顶栏 + 内容区（Outlet）
    ├── pages/
    │   ├── LoginPage.tsx           # 登录页：用户名/密码/验证码
    │   ├── DashboardPage.tsx       # 首页/仪表盘
    │   ├── users/
    │   │   └── UserListPage.tsx    # 用户管理：分页表格 + 创建弹窗 + 角色分配（Transfer）
    │   ├── roles/
    │   │   └── RoleListPage.tsx    # 角色管理：分页表格 + 创建/编辑弹窗 + 权限分配（Checkbox）
    │   └── permissions/
    │       └── PermissionListPage.tsx  # 权限管理：分页表格 + 创建/编辑弹窗
    ├── components/
    │   └── ProtectedRoute.tsx      # 路由守卫：无 Token 时重定向到 /login
    └── types/
        └── index.ts                # TypeScript 类型定义（与后端 Pydantic Schema 对应）
```

### 12.3 页面路由

**侧边栏导航**采用两级分类结构：

| 分类 | 路由 | 页面 | 状态 |
|------|------|------|------|
| — | `/login` | LoginPage（登录页） | ✅ |
| — | `/` | DashboardPage（首页） | ✅ |
| **系统管理** | `/users` | UserListPage（用户管理） | ✅ |
| | `/roles` | RoleListPage（角色管理） | ✅ |
| | `/permissions` | PermissionListPage（权限管理） | ✅ |
| **Agent 平台** | `/providers` | 模型供应商 | ✅ |
| | `/model-mgmt` | 模型管理 | ✅ |
| | `/prompts` | Prompt 管理 | ✅ |
| | `/knowledge` | 知识库管理 | ✅ |
| | `/tools` | 工具管理 | ✅ |
| | `/agents` | Agent 管理 | ✅ |
| | `/conversations` | 对话日志与统计 | ⬜ 待开发 |

**首页（Dashboard）** 展示完整的平台功能全景：
- **系统管理区域**：用户管理、角色管理、权限管理（已完成，可点击跳转）
- **Agent 平台区域**：7 个待开发模块的介绍卡片，标注了各模块的核心知识点

### 12.4 API 客户端设计

**统一响应处理**（`api/client.ts`）：

- **请求拦截器**：自动从 Zustand store（localStorage 持久化）中读取 token，附加 `Authorization: Bearer <token>` 请求头
- **响应拦截器**：
  - 自动解包后端 `ResponseSchema<T>` 中的 `data` 字段
  - `code !== 200` 时弹出错误提示
  - `401` 时清除 token 并跳转到登录页
  - `422` 时提取 Pydantic 验证错误信息并展示

**Vite 代理配置**（开发环境）：
- `/api/*` → `http://127.0.0.1:8000`
- `/users/*` → `http://127.0.0.1:8000`
- `/health` → `http://127.0.0.1:8000`

### 12.5 关键交互设计

**登录流程**：
1. 页面挂载时自动获取验证码图片（`GET /api/v1/captcha`）
2. 用户填写用户名、密码、验证码，点击登录
3. Token 写入 Zustand store → 自动持久化到 localStorage
4. 获取当前用户信息（`GET /users/me`）
5. 跳转到目标页面（或首页）

**用户管理**：
- 服务端分页 + 关键字搜索（username、email）
- 创建用户弹窗：用户名、邮箱、密码（6位以上）
- 分配角色弹窗：使用 Ant Design Transfer（穿梭框）组件，左侧列出所有角色，右侧显示已分配角色

**角色管理**：
- 服务端分页 + 关键字搜索（code、name）
- 创建/编辑弹窗：编码（创建时）、名称、描述
- 分配权限弹窗：Checkbox 列表展示所有权限，已分配的默认勾选

**权限管理**：
- 服务端分页 + 关键字搜索（code、name）
- 创建/编辑弹窗：权限编码（创建时）、名称、描述

### 12.6 启动方式

```bash
# 1. 确保后端服务已启动（参考第 11 节）

# 2. 安装依赖
cd app
npm install

# 3. 启动开发服务器
npm run dev
# 访问 http://localhost:5173

# 4. 生产构建
npm run build
# 输出到 app/dist/
```

---

## 13. 测试说明

### 13.1 测试目录结构

```
test/
├── test_sample.py           # 基础函数测试（示例）
├── test_async_sample.py     # 异步函数测试（示例）
└── utils/
    ├── test_jwt_utils.py    # JWT 签发/验证测试
    └── test_password.py     # 密码哈希/校验测试
```

### 13.2 运行测试

```bash
# 运行所有测试
pytest

# 运行指定文件
pytest test/utils/test_jwt_utils.py

# 详细输出
pytest -v
```

### 13.3 测试配置

`pyproject.toml` 中配置了 `pythonpath = ["."]`，确保测试可以正确导入 `src` 模块。

⚠️ **注意**：当前测试覆盖不完整，缺少对 API 层和数据库层的集成测试。

---

## 14. 扩展开发指南

### 14.1 添加新业务模块的步骤

假设要添加一个"日志管理"模块：

**Step 1：创建目录结构**
```
src/modules/audit_log/
├── __init__.py
├── model.py
├── schema.py
├── repository.py
├── service.py
└── api.py
```

**Step 2：定义 ORM 模型** (`model.py`)
```python
from src.core.base_model import BaseModel
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"
    user_id: Mapped[int] = mapped_column(comment="操作人ID")
    action: Mapped[str] = mapped_column(String(100), comment="操作类型")
    detail: Mapped[str] = mapped_column(Text, nullable=True, comment="操作详情")
```

**Step 3：定义 Schema** (`schema.py`)
```python
from pydantic import BaseModel

class AuditLogCreate(BaseModel):
    user_id: int
    action: str
    detail: str | None = None

class AuditLogRead(BaseModel):
    id: int
    user_id: int
    action: str
    detail: str | None
    model_config = {"from_attributes": True}
```

**Step 4：定义 Repository** (`repository.py`)
```python
from src.core.base_repository import BaseRepository
from src.modules.audit_log.model import AuditLog
from sqlalchemy.ext.asyncio import AsyncSession

class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(AuditLog, db)
```

**Step 5：定义 Service** (`service.py`)
```python
from src.modules.audit_log.repository import AuditLogRepository
from sqlalchemy.ext.asyncio import AsyncSession

class AuditLogService:
    def __init__(self, db: AsyncSession):
        self.repo = AuditLogRepository(db)

    async def create_log(self, data) -> AuditLog:
        log = AuditLog(**data.model_dump())
        return await self.repo.create(log)
```

**Step 6：定义 API 路由** (`api.py`)
```python
from fastapi import APIRouter, Depends
router = APIRouter(prefix="/audit-logs", tags=["AuditLog"])

@router.get("")
async def list_logs(svc: AuditLogService = Depends(get_audit_log_service)):
    ...
```

**Step 7：注册路由和迁移**
- 在 `src/main.py` 中 `include_router(audit_log_router)`
- 在 `alembic/env.py` 中 `import src.modules.audit_log.model`
- 运行 `alembic revision --autogenerate -m "添加审计日志表"`
- 运行 `alembic upgrade head`

### 14.2 常见开发场景

**场景 A：给已有模块添加新字段**
1. 修改 `model.py`，添加新列
2. 修改 `schema.py`，更新对应的 Pydantic 模型
3. 运行 `alembic revision --autogenerate -m "描述变更"`
4. 运行 `alembic upgrade head`

**场景 B：给接口添加权限保护**
```python
@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_permission("user:delete"))
):
    ...
```

**场景 C：添加全局中间件**
在 `src/middlewares/` 下新建文件，然后在 `src/main.py` 的 `create_app()` 中注册：
```python
app.add_middleware(YourMiddleware)
```

### 14.3 代码规范

1. **命名约定**：
   - 文件名：`snake_case`
   - 类名：`PascalCase`
   - 函数/变量：`snake_case`
   - 常量：`UPPER_SNAKE_CASE`

2. **模块内引用**：使用 `from src.modules.xxx.yyy import ZZZ` 绝对导入

3. **异步一致性**：所有数据库操作使用 `await`，所有 Repository 和 Service 方法都是 `async`

4. **错误处理**：使用 `BizException` 抛出业务异常，避免使用 HTTPException

5. **ORM 转 Pydantic**：使用 `YourSchema.model_validate(orm_obj)` 进行转换（Pydantic v2 语法）

### 14.4 已知待改进项

| 问题 | 优先级 | 说明 |
|------|--------|------|
| JWT 密钥硬编码 | 🔴 高 | `jwt_utils.py` 中 `SECRET_KEY` 应移至 `.env` |
| 缺少 refresh token | 🟡 中 | 当前只有 access token，过期需重新登录 |
| 缺少接口限流 | 🟡 中 | 登录接口等需要防暴力破解 |
| 缺少 API 版本控制 | 🟢 低 | 部分路由有 `/api/v1` 前缀，部分没有，不一致 |
| `async_sample.py` | 🟢 低 | 示例文件，应清理 |
| 缺少集成测试 | 🟡 中 | 当前仅有工具函数单测 |

---

> **本文档旨在帮助新开发者（包括 AI 编码助手）快速理解项目全貌和编码约定。如有疑问，请查阅源码注释或联系项目维护者。**
