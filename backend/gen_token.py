import os
import sys
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import create_access_token
from datetime import timedelta

def get_token():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("No users found in database.")
            return None
        
        token = create_access_token(
            subject=user.email,
            expires_delta=timedelta(hours=1)
        )
        return token
    finally:
        db.close()

if __name__ == "__main__":
    token = get_token()
    if token:
        print(token)
        with open(".test_token", "w") as f:
            f.write(token)
