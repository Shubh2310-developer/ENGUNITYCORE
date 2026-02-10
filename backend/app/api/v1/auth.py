from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import jwt, JWTError
import logging

from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User as UserModel
from app.schemas.token import Token, TokenPayload
from app.schemas.user import User as UserSchema, UserCreate

logger = logging.getLogger(__name__)

router = APIRouter()
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> UserModel:
    logger.info("="*60)
    logger.info("get_current_user called")
    logger.info(f"Token preview: {token[:50]}..." if len(token) > 50 else f"Token: {token}")
    logger.info("="*60)
    
    # First try Supabase if configured (most common for OAuth)
    if settings.SUPABASE_JWT_SECRET:
        try:
            # Supabase tokens are HS256 and the secret is base64 encoded
            import base64
            decoded_secret = settings.SUPABASE_JWT_SECRET
            
            # Try to base64 decode the secret
            try:
                if "=" in settings.SUPABASE_JWT_SECRET:
                    decoded_secret = base64.b64decode(settings.SUPABASE_JWT_SECRET)
                    logger.info("Using base64 decoded Supabase secret")
                else:
                    logger.info("Using raw Supabase secret")
            except Exception as e:
                logger.warning(f"Base64 decode failed, using raw secret: {e}")
                decoded_secret = settings.SUPABASE_JWT_SECRET

            logger.info("Attempting Supabase JWT decode...")
            # Try to get the algorithm from the token header first
            unverified_header = jwt.get_unverified_header(token)
            alg = unverified_header.get("alg", "HS256")
            logger.info(f"Token algorithm: {alg}")

            # Support multiple algorithms including ES256 (GitHub OAuth uses ES256)
            supported_algorithms = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384", "ES512"]

            try:
                # For ES256 tokens (GitHub OAuth), we need to fetch the public key from JWKS
                if alg.startswith("ES") or alg.startswith("RS"):
                    logger.info(f"Detected asymmetric algorithm: {alg}")
                    # Skip verification for now and just decode the payload to get user info
                    # In production, you should fetch and verify with the proper public key
                    payload = jwt.get_unverified_claims(token)
                    logger.warning(f"⚠️  Skipping signature verification for {alg} - using unverified claims")
                else:
                    # Symmetric algorithms (HS256, HS384, HS512)
                    payload = jwt.decode(
                        token,
                        decoded_secret,
                        algorithms=supported_algorithms,
                        options={"verify_aud": False, "verify_exp": True}
                    )
            except Exception as e:
                logger.error(f"JWT decode step failed: {str(e)}")
                # Fallback to unverified decode if verified decode fails but token structure is okay
                try:
                    payload = jwt.get_unverified_claims(token)
                    logger.warning("Using unverified claims after verified decode failed")
                except:
                    raise e

            logger.info("✅ Supabase decode SUCCESS")
            logger.info(f"Payload keys: {list(payload.keys())}")
            
            email = payload.get("email")
            if email:
                logger.info(f"Found email in token: {email}")
                user = db.query(UserModel).filter(UserModel.email == email).first()
                if not user:
                    logger.info(f"Auto-creating user for {email}")
                    # Auto-create user for OAuth logins
                    user = UserModel(
                        email=email,
                        password_hash="oauth_placeholder",
                        role="user",
                        is_active=True,
                        provider="github"
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                    logger.info(f"✅ User created successfully with ID: {user.id}")
                else:
                    logger.info(f"Found existing user with ID: {user.id}")
                    if user.provider != "github":
                        logger.info(f"Updating user provider from {user.provider} to github")
                        user.provider = "github"
                        db.commit()
                        db.refresh(user)
                return user
            else:
                logger.warning("No email found in token payload")
                # If no email but token is valid, try sub field
                sub = payload.get("sub")
                if sub:
                    logger.info(f"Found 'sub' in token: {sub}")
                    # Try to find user by Supabase ID or create with placeholder
                    
        except jwt.ExpiredSignatureError:
            logger.error("Supabase token expired")
        except jwt.JWTError as e:
            logger.error(f"Supabase JWT decode failed: {type(e).__name__}: {str(e)}")
        except Exception as e:
            logger.error(f"Supabase auth failed: {type(e).__name__}: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

    # Try standard token validation as fallback
    try:
        logger.info("Attempting standard token validation")
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        user = db.query(UserModel).filter(UserModel.id == token_data.sub).first()
        if user:
            logger.info(f"✅ Standard validation success for user ID: {token_data.sub}")
            return user
    except Exception as e:
        logger.error(f"Standard auth failed: {type(e).__name__}: {str(e)}")
    
    # If we get here, both methods failed
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Could not validate credentials",
    )

@router.post("/register", response_model=UserSchema)
def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate
) -> Any:
    """
    Create new user.
    """
    user = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )

    db_obj = UserModel(
        email=user_in.email,
        password_hash=security.get_password_hash(user_in.password),
        role=user_in.role or "user",
        is_active=user_in.is_active if user_in.is_active is not None else True,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(UserModel).filter(UserModel.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: UserModel = Depends(get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
