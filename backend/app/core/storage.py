import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import get_settings

settings = get_settings()


ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}


def ensure_upload_dir() -> Path:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def validate_file_extension(filename: str) -> None:
    extension = get_file_extension(filename)

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type. Allowed types: PDF, TXT, MD")


def validate_file_size(file: UploadFile) -> int:
    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > max_size_bytes:
        raise ValueError(f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit")

    return size


def save_upload_file(file: UploadFile) -> tuple[str, int]:
    validate_file_extension(file.filename)
    size = validate_file_size(file)

    upload_dir = ensure_upload_dir()

    extension = get_file_extension(file.filename)
    stored_filename = f"{uuid.uuid4()}{extension}"
    stored_path = upload_dir / stored_filename

    with stored_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return str(stored_path), size


def delete_file_if_exists(file_path: str) -> None:
    path = Path(file_path)

    if path.exists() and path.is_file():
        path.unlink()