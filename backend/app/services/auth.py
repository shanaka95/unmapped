import hashlib
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserResponse,
)
from app.services.email import send_password_reset_email, send_verification_email
from app.utils.jwt import create_access_token, create_refresh_token, decode_token
from app.utils.security import hash_password, verify_password


class AuthService:

    @staticmethod
    def register(db: Session, data: RegisterRequest) -> tuple[AuthResponse, str]:
        existing = db.execute(
            select(User).where(User.email == data.email.lower().strip())
        ).scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        user = User(
            name=data.name.strip(),
            email=data.email.lower().strip(),
            password_hash=hash_password(data.password),
            is_active=True,
            is_verified=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        refresh_jwt = _create_refresh_token(db, user.id)
        _send_verification_email(user.email, user.id)

        access_token = create_access_token(str(user.id))
        return AuthResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user),
        ), refresh_jwt

    @staticmethod
    def login(db: Session, data: LoginRequest) -> tuple[AuthResponse, str]:
        user = db.execute(
            select(User).where(User.email == data.email.lower().strip())
        ).scalar_one_or_none()

        if user is None or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated.",
            )

        db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user.id, RefreshToken.is_revoked == False)
            .values(is_revoked=True)
        )
        db.flush()

        refresh_jwt = _create_refresh_token(db, user.id)
        access_token = create_access_token(str(user.id))
        db.commit()

        return AuthResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user),
        ), refresh_jwt

    @staticmethod
    def verify_email(db: Session, token: str) -> UserResponse:
        payload = _decode_email_token(token, expected_type="verify")
        user_id = int(payload["sub"])

        user = db.execute(
            select(User).where(User.id == user_id)
        ).scalar_one_or_none()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
            )

        if user.is_verified:
            return UserResponse.model_validate(user)

        user.is_verified = True
        db.commit()
        db.refresh(user)
        return UserResponse.model_validate(user)

    @staticmethod
    def forgot_password(db: Session, email: str) -> str:
        user = db.execute(
            select(User).where(User.email == email.lower().strip())
        ).scalar_one_or_none()

        if user and user.is_active:
            reset_token = _create_email_token(user.id, "reset", hours=1)
            send_password_reset_email(user.email, reset_token)

        return "If an account with that email exists, a reset link has been sent."

    @staticmethod
    def reset_password(db: Session, data: ResetPasswordRequest) -> str:
        payload = _decode_email_token(data.token, expected_type="reset")
        user_id = int(payload["sub"])

        user = db.execute(
            select(User).where(User.id == user_id)
        ).scalar_one_or_none()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
            )

        user.password_hash = hash_password(data.new_password)
        db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user.id)
            .values(is_revoked=True)
        )
        db.commit()
        return "Password has been reset successfully."

    @staticmethod
    def refresh_access_token(db: Session, refresh_jwt: str) -> tuple[str, str]:
        try:
            payload = decode_token(refresh_jwt)
        except Exception:
            raise _invalid_token_error()

        if payload.get("type") != "refresh":
            raise _invalid_token_error()

        token_id = payload.get("jti")
        user_id = int(payload["sub"])

        token_record = db.execute(
            select(RefreshToken).where(RefreshToken.id == token_id)
        ).scalar_one_or_none()

        if token_record is None:
            db.execute(
                update(RefreshToken)
                .where(RefreshToken.user_id == user_id)
                .values(is_revoked=True)
            )
            db.commit()
            raise _invalid_token_error()

        if token_record.is_revoked:
            db.execute(
                update(RefreshToken)
                .where(RefreshToken.user_id == user_id)
                .values(is_revoked=True)
            )
            db.commit()
            raise _invalid_token_error()

        token_hash = hashlib.sha256(refresh_jwt.encode()).hexdigest()
        if token_record.token_hash != token_hash:
            raise _invalid_token_error()

        token_record.is_revoked = True

        new_access = create_access_token(str(user_id))
        new_refresh = _create_refresh_token(db, user_id)
        db.commit()
        return new_access, new_refresh

    @staticmethod
    def logout(db: Session, refresh_jwt: str | None) -> str:
        if refresh_jwt is None:
            return "Logged out"

        try:
            payload = decode_token(refresh_jwt)
            token_id = payload.get("jti")
            if token_id:
                record = db.execute(
                    select(RefreshToken).where(RefreshToken.id == token_id)
                ).scalar_one_or_none()
                if record and not record.is_revoked:
                    record.is_revoked = True
                    db.commit()
        except Exception:
            pass

        return "Logged out"

    @staticmethod
    def get_current_user(db: Session, user_id: int) -> UserResponse:
        user = db.execute(
            select(User).where(User.id == user_id)
        ).scalar_one_or_none()

        if user is None or not user.is_active:
            raise _invalid_token_error()

        return UserResponse.model_validate(user)


# --- Private helpers ---


def _create_refresh_token(db: Session, user_id: int) -> str:
    settings = get_settings()
    token_id = str(uuid.uuid4())
    refresh_jwt = create_refresh_token(str(user_id), token_id)
    token_hash = hashlib.sha256(refresh_jwt.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)

    record = RefreshToken(
        id=token_id,
        user_id=user_id,
        token_hash=token_hash,
        is_revoked=False,
        expires_at=expires_at,
    )
    db.add(record)
    db.flush()
    return refresh_jwt


def _create_email_token(user_id: int, purpose: str, hours: int) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": purpose,
        "exp": now + timedelta(hours=hours),
        "iat": now,
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def _decode_email_token(token: str, expected_type: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except Exception:
        raise _invalid_token_error()

    if payload.get("type") != expected_type:
        raise _invalid_token_error()

    return payload


def _send_verification_email(email: str, user_id: int) -> None:
    token = _create_email_token(user_id, "verify", hours=24)
    send_verification_email(email, token)


def _invalid_token_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
    )
