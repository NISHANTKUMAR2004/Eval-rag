import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()


def get_engine_url(raw_url: str) -> str:
    """Safe helper to URL-encode passwords containing special characters (like @ or :) in SQLAlchemy."""
    if not raw_url:
        return raw_url
        
    prefix = ""
    if raw_url.startswith("postgresql://"):
        prefix = "postgresql://"
    elif raw_url.startswith("postgres://"):
        prefix = "postgres://"
        
    if not prefix:
        return raw_url
        
    try:
        url_without_prefix = raw_url[len(prefix):]
        if "@" in url_without_prefix:
            credentials, host_info = url_without_prefix.rsplit("@", 1)
            if ":" in credentials:
                username, password = credentials.split(":", 1)
                # URL-encode the password to prevent parsing conflicts with SQLAlchemy/psycopg2
                encoded_password = urllib.parse.quote_plus(password)
                return f"postgresql://{username}:{encoded_password}@{host_info}"
    except Exception:
        pass
        
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql://", 1)
    return raw_url


engine = create_engine(
    get_engine_url(settings.DATABASE_URL),
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()