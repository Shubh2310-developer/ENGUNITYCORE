import os
import sys
from pathlib import Path

# Add project directories to python path
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(project_root))
sys.path.append(str(project_root / "backend"))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def create_test_user():
    db = SessionLocal()
    try:
        # Check if test@example.com exists
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            print("Creating test user: test@example.com...")
            hashed_pwd = get_password_hash("testpassword123")
            user = User(
                email="test@example.com",
                password_hash=hashed_pwd,
                role="admin",
                is_active=True
            )
            db.add(user)
            db.commit()
            print("Test user created successfully!")
        else:
            print("Test user test@example.com already exists.")
            # Let's reset the password to ensure it's correct
            hashed_pwd = get_password_hash("testpassword123")
            user.password_hash = hashed_pwd
            db.commit()
            print("Test user password reset to 'testpassword123' successfully!")
    except Exception as e:
        print(f"Error seeding user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
