from fastapi import FastAPI
from src.core.config import get_settings
from src.infra.minio_client import ensure_bucket_exists
from src.middlewares.logging import LoggingMiddleware
from src.core.exceptions import register_exception_handlers
from src.core.logger import setup_logger
from loguru import logger
from src.infra.database import engine
from src.modules.user.api import router as user_router
from src.modules.captcha.api import router as captcha_router
from src.modules.auth.api import router as auth_router
from src.modules.permission.api import router as permission_router
from src.modules.role.api import router as role_router
from src.modules.provider.api import router as provider_router
from src.modules.model.api import router as model_router
from src.modules.prompt.api import router as prompt_router
from src.modules.knowledge.api import router as knowledge_router
from src.modules.tool.api import router as tool_router
from src.modules.agent.api import router as agent_router

# 使用上下文管理器感知项目的生命周期
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 在应用启动时执行的代码
    setup_logger() # 初始化日志
    settings = get_settings()
    logger.info(f"{settings.APP_NAME} 启动.. | 使用环境： {settings.APP_ENV}")
    # MinIO 启动检查                                              ← 新增
    try:
        ensure_bucket_exists()
        logger.info(f"MinIO 连接成功，bucket: {settings.MINIO_BUCKET}")
    except Exception as e:
        # MinIO 不可用不阻止应用启动，只打印警告
        # 文档上传功能会在实际调用时报错，不影响其他模块
        logger.warning(f"MinIO 连接失败，文档上传功能不可用: {e}")
    yield
    # 在应用关闭时执行的代码
    await engine.dispose()
    # MinIO 客户端无需显式关闭（底层 urllib3 连接会自动回收）
    logger.info(f"{settings.APP_NAME} 关闭.. | 使用环境： {settings.APP_ENV}")

def create_app() -> FastAPI:

    settings = get_settings()
    
    # 创建应用
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        debug=settings.APP_DEBUG,
        lifespan=lifespan
    )

    # 注册中间件
    app.add_middleware(LoggingMiddleware)

    # 注册异常处理器
    register_exception_handlers(app)
    # 注册跨域中间件
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 注册路由
    app.include_router(user_router)
    app.include_router(captcha_router, prefix="/api/v1")
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(permission_router, prefix="/api/v1")
    app.include_router(role_router, prefix="/api/v1")
    app.include_router(provider_router, prefix="/api/v1")
    app.include_router(model_router, prefix="/api/v1")
    app.include_router(prompt_router, prefix="/api/v1")
    app.include_router(knowledge_router, prefix="/api/v1")
    app.include_router(tool_router, prefix="/api/v1")
    app.include_router(agent_router, prefix="/api/v1")

    return app

app = create_app()

# 健康检查路由
@app.get("/health")
async def root():
    return {"message": "Hellow World!"}
