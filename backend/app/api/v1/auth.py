from dataclasses import dataclass
from datetime import datetime
from hashlib import sha256
import json
from typing import Any, Dict, Optional, Tuple
from urllib import error as urlerror
from urllib import parse, request as urlrequest

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import EmailStr
from sqlalchemy.orm import Session
import logging
import asyncio
from jose import JWTError, jwt

from app.core.config import settings
from app.core.database import get_db
from app.core.mongodb import mongodb
from app.core.rate_limit import limiter
from app.core.security import ALGORITHM, create_access_token, get_password_hash, verify_password
from app.schemas.token import Token
from app.schemas.user import User as UserSchema, UserCreate

logger = logging.getLogger(__name__)

router = APIRouter()
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


class SupabaseAuthUnavailable(Exception):
    pass

@dataclass
class AuthenticatedUser:
    id: int
    email: str
    role: str = "user"
    is_active: bool = True
    provider: str = "supabase"


def _supabase_key() -> Optional[str]:
    return settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_ROLE_KEY


def _ensure_supabase_configured() -> Tuple[str, str]:
    if not settings.SUPABASE_URL or not _supabase_key():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase authentication is not configured",
        )
    return settings.SUPABASE_URL.rstrip("/"), _supabase_key()  # type: ignore[return-value]


def _stable_user_id(source_id: str) -> int:
    digest = sha256(source_id.encode("utf-8")).hexdigest()
    return int(digest[:8], 16)


def _sync_http_json(
    method: str,
    url: str,
    headers: Dict[str, str],
    payload: Optional[Dict[str, Any]] = None,
) -> Tuple[int, Dict[str, Any]]:
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    req = urlrequest.Request(url=url, data=data, method=method)
    for key, value in headers.items():
        req.add_header(key, value)

    try:
        with urlrequest.urlopen(req, timeout=12) as response:
            body = response.read().decode("utf-8") if response else "{}"
            return response.status, json.loads(body or "{}")
    except urlerror.HTTPError as exc:
        body = exc.read().decode("utf-8") if exc.fp else "{}"
        try:
            parsed = json.loads(body or "{}")
        except json.JSONDecodeError:
            parsed = {"detail": body or "Supabase request failed"}
        return exc.code, parsed
    except Exception as exc:
        raise SupabaseAuthUnavailable(str(exc)) from exc


async def _supabase_request_json(
    method: str,
    path: str,
    token: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
) -> Tuple[int, Dict[str, Any]]:
    base_url, key = _ensure_supabase_configured()
    headers: Dict[str, str] = {
        "apikey": key,
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    return await asyncio.to_thread(
        _sync_http_json,
        method,
        f"{base_url}{path}",
        headers,
        payload,
    )


def _local_register_user(db: Session, user_in: UserCreate) -> UserSchema:
    from app.models.user import User as UserModel

    existing = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )

    user = UserModel(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role="user",
        is_active=True,
        provider="local",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserSchema(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        provider=user.provider or "local",
    )


def _local_login_user(db: Session, email: str, password: str) -> Token:
    from app.models.user import User as UserModel

    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user.id), token_type="bearer")


def _local_user_from_token(db: Session, token: str) -> AuthenticatedUser:
    from app.models.user import User as UserModel

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        subject = payload.get("sub")
        if not subject or not str(subject).isdigit():
            raise JWTError("Invalid subject")
        user_id = int(subject)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        ) from exc

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    return AuthenticatedUser(
        id=user.id,
        email=user.email,
        role=user.role or "user",
        is_active=bool(user.is_active),
        provider=user.provider or "local",
    )


async def _upsert_mongo_user_profile(
    supabase_user_id: str,
    email: str,
    role: str,
    provider: str,
) -> None:
    if mongodb.db is None:
        return

    try:
        now = datetime.utcnow()
        await mongodb.db.user_profiles.update_one(
            {"supabase_id": supabase_user_id},
            {
                "$set": {
                    "email": email,
                    "role": role,
                    "provider": provider,
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "created_at": now,
                },
            },
            upsert=True,
        )
    except Exception as exc:
        logger.warning("Mongo user profile upsert failed: %s", exc)


def _upsert_postgres_user_sync(email: str, role: str, provider: str) -> Optional[int]:
    """
    Ensure Supabase-authenticated user exists in the postgres `users` table.
    Returns the actual postgres integer ID so FK references work correctly.
    Called via asyncio.to_thread to avoid blocking the event loop.
    """
    try:
        from app.core.database import SessionLocal
        from app.models.user import User as UserModel
        db = SessionLocal()
        try:
            user = db.query(UserModel).filter(UserModel.email == email).first()
            if user:
                return user.id
            # User not in postgres yet — create a shadow row for Supabase-managed auth
            new_user = UserModel(
                email=email,
                password_hash="supabase_managed",  # Placeholder; auth is handled by Supabase
                role=role,
                is_active=True,
                provider=provider or "supabase",
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user.id
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Postgres user upsert failed (non-fatal): %s", exc)
        return None


async def _upsert_postgres_user(email: str, role: str, provider: str) -> Optional[int]:
    """Async wrapper for postgres user upsert."""
    return await asyncio.to_thread(_upsert_postgres_user_sync, email, role, provider)


def _build_authenticated_user(user_payload: Dict[str, Any]) -> AuthenticatedUser:
    user_metadata = user_payload.get("user_metadata") or {}
    app_metadata = user_payload.get("app_metadata") or {}

    supabase_user_id = user_payload.get("id")
    email = user_payload.get("email")
    if not supabase_user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

    provider = app_metadata.get("provider") or user_payload.get("provider") or "supabase"
    role = user_metadata.get("role") or app_metadata.get("role") or "user"
    is_active = user_payload.get("banned_until") is None

    return AuthenticatedUser(
        id=_stable_user_id(supabase_user_id),
        email=email,
        role=role,
        is_active=is_active,
        provider=provider,
    )


async def get_current_user(
    token: str = Depends(reusable_oauth2),
    db: Session = Depends(get_db),
) -> AuthenticatedUser:
    try:
        # Validate Supabase JWT Locally without hitting the network
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        # Adapt payload to match _build_authenticated_user expectations
        if "sub" in payload and "id" not in payload:
            payload["id"] = payload["sub"]
    except JWTError as exc:
        logger.error(f"Supabase local JWT decode failed: {exc}")
        
        # Fallback to network validation if local decode fails (e.g., due to RS256 alg or rotated keys)
        try:
            status_code, user_payload = await _supabase_request_json("GET", "/auth/v1/user", token=token)
            if status_code in (200, 201) and user_payload and "id" in user_payload:
                payload = user_payload
            else:
                raise ValueError(f"Network validation returned status {status_code}")
        except Exception as net_exc:
            logger.error(f"Supabase network validation failed: {net_exc}")
            try:
                return _local_user_from_token(db, token)
            except HTTPException as e:
                logger.error(f"Local user from token failed: {e.detail}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Could not validate credentials",
                )
    except Exception as exc:
        logger.error(f"Unexpected error in get_current_user decoding: {exc}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

    current_user = _build_authenticated_user(payload)

    # Parallel: sync to MongoDB profile + upsert into postgres users table
    # The postgres upsert is critical — it ensures the user has a real DB row
    # so that FK references (e.g. chat_sessions.user_id) don't cause IntegrityErrors.
    mongo_task = asyncio.create_task(
        _upsert_mongo_user_profile(
            supabase_user_id=payload.get("id"),
            email=current_user.email,
            role=current_user.role,
            provider=current_user.provider,
        )
    )
    # Upsert into postgres and get the real integer DB id
    db_user_id = await _upsert_postgres_user(
        email=current_user.email,
        role=current_user.role,
        provider=current_user.provider,
    )
    # Update the current_user id to the real postgres id (fixes FK constraint)
    if db_user_id is not None:
        current_user.id = db_user_id

    # Let mongo task complete in background; don't block on it
    try:
        await asyncio.wait_for(mongo_task, timeout=2.0)
    except Exception:
        pass  # Non-critical

    return current_user

@router.post("/register", response_model=UserSchema)
async def register_user(*, user_in: UserCreate, db: Session = Depends(get_db)) -> Any:
    """
    Create new user.
    """
    try:
        status_code, payload = await _supabase_request_json(
            "POST",
            "/auth/v1/signup",
            payload={
                "email": user_in.email,
                "password": user_in.password,
                "data": {"role": "user"},
            },
        )
    except SupabaseAuthUnavailable:
        return _local_register_user(db, user_in)

    if status_code not in (200, 201):
        message = str(payload.get("msg") or payload.get("error_description") or payload.get("error") or payload.get("detail") or "Registration failed")
        lowered = message.lower()
        if "already registered" in lowered or "already exists" in lowered:
            message = "The user with this username already exists in the system."
        raise HTTPException(
            status_code=400,
            detail=message,
        )

    supabase_user = payload.get("user") or {}
    supabase_user_id = supabase_user.get("id") or str(user_in.email)
    provider = (supabase_user.get("app_metadata") or {}).get("provider") or "supabase"

    await _upsert_mongo_user_profile(
        supabase_user_id=supabase_user_id,
        email=user_in.email,
        role="user",
        provider=provider,
    )

    return UserSchema(
        id=_stable_user_id(str(supabase_user_id)),
        email=user_in.email,
        role="user",
        is_active=True,
        provider=provider,
    )

@router.post("/login", response_model=Token)
@limiter.limit(settings.AUTH_LOGIN_RATE_LIMIT)
async def login_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    query = parse.urlencode({"grant_type": "password"})
    try:
        status_code, payload = await _supabase_request_json(
            "POST",
            f"/auth/v1/token?{query}",
            payload={
                "email": form_data.username,
                "password": form_data.password,
            },
        )
    except SupabaseAuthUnavailable:
        return _local_login_user(db, form_data.username, form_data.password)

    if status_code not in (200, 201) or not payload.get("access_token"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": payload["access_token"],
        "token_type": payload.get("token_type", "bearer"),
    }

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Any:
    """
    Get current user.
    """
    return UserSchema(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        provider=current_user.provider,
    )
