from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.projects import router as projects_router
from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import logger, setup_logging
from app.api.routes.documents import router as documents_router
from app.api.routes.chunks import router as chunks_router
from app.api.routes.datasets import router as datasets_router
from app.api.routes.test_cases import router as test_cases_router
from app.api.routes.rag_runs import router as rag_runs_router
from app.api.routes.evaluations import router as evaluations_router
from app.api.routes.batch_evaluations import router as batch_evaluations_router
from app.api.routes.dashboard import router as dashboard_router, global_stats_router as dashboard_stats_router
from app.api.routes.chat import router as chat_router

settings = get_settings()

setup_logging()


def create_app() -> FastAPI:
    # Run database migrations programmatically on startup (bypasses Render Free Tier Pre-Deploy limitation)
    try:
        import os
        from alembic.config import Config
        from alembic import command
        
        logger.info("Triggering database migrations programmatically on startup...")
        # Resolve alembic.ini path relative to app folder
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        alembic_ini_path = os.path.join(base_dir, "alembic.ini")
        
        if os.path.exists(alembic_ini_path):
            alembic_cfg = Config(alembic_ini_path)
            # Ensure it uses the resolved path for the script location too
            alembic_cfg.set_main_option("script_location", os.path.join(base_dir, "alembic"))
            command.upgrade(alembic_cfg, "head")
            logger.info("Programmatic database migrations executed successfully!")
        else:
            logger.warning(f"alembic.ini not found at {alembic_ini_path}, skipping startup migrations.")
    except Exception as e:
        logger.error(f"Failed to run programmatic migrations on startup: {e}")

    app = FastAPI(
        title=settings.APP_NAME,
        description="EvalGuard AI - Multi-Agent RAG Evaluation Platform Backend API",
        version="0.2.0",
        debug=settings.DEBUG,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(health_router, prefix=settings.API_V1_PREFIX)
    app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
    app.include_router(dashboard_stats_router, prefix=settings.API_V1_PREFIX)
    app.include_router(projects_router, prefix=settings.API_V1_PREFIX)
    app.include_router(documents_router, prefix=settings.API_V1_PREFIX)
    app.include_router(chunks_router, prefix=settings.API_V1_PREFIX)
    app.include_router(datasets_router, prefix=settings.API_V1_PREFIX)
    app.include_router(test_cases_router, prefix=settings.API_V1_PREFIX)
    app.include_router(rag_runs_router, prefix=settings.API_V1_PREFIX)
    app.include_router(evaluations_router, prefix=settings.API_V1_PREFIX)
    app.include_router(batch_evaluations_router, prefix=settings.API_V1_PREFIX)
    app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
    app.include_router(chat_router, prefix=settings.API_V1_PREFIX)

    @app.get("/")
    def root():
        return {
            "success": True,
            "message": "Welcome to EvalGuard AI Backend",
            "docs": "/docs",
            "health": f"{settings.API_V1_PREFIX}/health",
            "version": "0.10.0",
        }

    logger.info("EvalGuard AI backend application created successfully")

    return app


app = create_app()