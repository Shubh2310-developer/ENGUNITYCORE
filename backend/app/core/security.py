from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
import bcrypt

# Monkey patch bcrypt to avoid AttributeError: module 'bcrypt' has no attribute '__about__'
# This is required because passlib isn't fully compatible with bcrypt >= 4.0
if not hasattr(bcrypt, "__about__"):
    try:
        class About:
            __version__ = bcrypt.__version__
        bcrypt.__about__ = About()
    except Exception:
        pass

# Monkey patch bcrypt.hashpw to handle the 72 byte limit for passlib 1.7.4 compatibility
# This is necessary because passlib tests for a wrap bug using a long password, 
# which causes newer bcrypt versions to raise ValueError instead of truncating.
_original_hashpw = bcrypt.hashpw

def _adherent_hashpw(password, salt):
    # Ensure password is bytes
    if isinstance(password, str):
        password = password.encode('utf-8')
    
    # Truncate to 72 bytes to avoid ValueError from bcrypt
    if len(password) > 72:
        password = password[:72]
        
    return _original_hashpw(password, salt)

bcrypt.hashpw = _adherent_hashpw


from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def _truncate_password(password: str) -> str:
    # bcrypt has a maximum password length of 72 bytes.
    # We truncate it to 72 bytes to avoid ValueError.
    return password[:72]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Truncate to ensure we are verifying the same thing that was hashed
        truncated_password = _truncate_password(plain_password)
        return pwd_context.verify(truncated_password, hashed_password)
    except ValueError:
        # Fallback for safety, though truncation should prevent this
        return False


def get_password_hash(password: str) -> str:
    truncated_password = _truncate_password(password)
    return pwd_context.hash(truncated_password)
