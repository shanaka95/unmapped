from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.dependencies import get_current_user_id, get_db
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    UserResponse,
    VerifyEmailRequest,
)
from app.services.auth import AuthService
from app.utils.jwt import decode_token as _decode_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, value: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key="refresh_token",
        value=value,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 86400,
        path="/api/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key="refresh_token", path="/api/auth")


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    auth_response, refresh_jwt = AuthService.register(db, data)
    _set_refresh_cookie(response, refresh_jwt)
    return auth_response


@router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    auth_response, refresh_jwt = AuthService.login(db, data)
    _set_refresh_cookie(response, refresh_jwt)
    return auth_response


@router.post("/verify-email", response_model=UserResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    return AuthService.verify_email(db, data.token)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    message = AuthService.forgot_password(db, data.email)
    return MessageResponse(message=message)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    message = AuthService.reset_password(db, data)
    return MessageResponse(message=message)


@router.post("/refresh", response_model=AuthResponse)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_jwt = request.cookies.get("refresh_token")
    if not refresh_jwt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing.",
        )

    new_access, new_refresh = AuthService.refresh_access_token(db, refresh_jwt)
    _set_refresh_cookie(response, new_refresh)

    payload = _decode_token(new_access)
    user = AuthService.get_current_user(db, int(payload["sub"]))

    return AuthResponse(access_token=new_access, user=user)


@router.post("/logout", response_model=MessageResponse)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_jwt = request.cookies.get("refresh_token")
    message = AuthService.logout(db, refresh_jwt)
    _clear_refresh_cookie(response)
    return MessageResponse(message=message)


@router.get("/me", response_model=UserResponse)
def get_me(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return AuthService.get_current_user(db, user_id)
