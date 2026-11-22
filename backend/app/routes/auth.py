from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.auth import get_current_active_user
from app.services.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
    description="Register a new user account with role 'teacher' or 'student'. Passwords are securely hashed with Argon2.",
)
def register_user(
    payload: UserRegisterRequest,
    db: Session = Depends(get_db),
):
    normalized_email = payload.email.lower().strip()

    # Verify role explicitly
    if payload.role.value not in ["teacher", "student"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'teacher' or 'student'",
        )

    # Check for existing email registration
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered. Please login or use a different email address.",
        )

    # Hash password with Argon2
    hashed_pwd = hash_password(payload.password)

    new_user = User(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        hashed_password=hashed_pwd,
        role=payload.role.value,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticate user with email and password, returning a signed JWT access token.",
)
def login_user(
    payload: UserLoginRequest,
    db: Session = Depends(get_db),
):
    normalized_email = payload.email.lower().strip()

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password with Argon2
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user account has been deactivated",
        )

    # Issue JWT token with claims
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
    }
    access_token = create_access_token(token_data)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile",
    description="Retrieve the profile of the currently authenticated user.",
)
def read_current_user(
    current_user: User = Depends(get_current_active_user),
):
    return current_user
