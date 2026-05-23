from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest

settings = get_settings()


class AuthService:
    def get_user_by_email(self, db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email.lower()).first()

    def register_user(self, db: Session, payload: RegisterRequest) -> User:
        existing_user = self.get_user_by_email(db, payload.email)

        if existing_user:
            raise ValueError("User with this email already exists")

        user = User(
            full_name=payload.full_name.strip(),
            email=payload.email.lower(),
            hashed_password=hash_password(payload.password),
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    def authenticate_user(self, db: Session, payload: LoginRequest) -> User:
        user = self.get_user_by_email(db, payload.email)

        if not user:
            raise ValueError("Invalid email or password")

        if not verify_password(payload.password, user.hashed_password):
            raise ValueError("Invalid email or password")

        if not user.is_active:
            raise ValueError("User account is inactive")

        return user

    def create_token_for_user(self, user: User) -> str:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        return create_access_token(
            subject=str(user.id),
            expires_delta=expires_delta,
            extra_data={
                "email": user.email,
                "role": user.role.value,
            },
        )


auth_service = AuthService()