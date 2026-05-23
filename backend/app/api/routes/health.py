from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import get_db
from app.core.config import get_settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def health_check():
    settings = get_settings()

    return {
        "success": True,
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/db")
def database_health_check():
    db_generator = get_db()
    db = next(db_generator)

    try:
        db.execute(text("SELECT 1"))
        return {
            "success": True,
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    finally:
        db.close()