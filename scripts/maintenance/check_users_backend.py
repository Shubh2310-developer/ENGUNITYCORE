from app.core.database import SessionLocal
from app.models.user import User
from app.models.decision import Decision
from app.models.research import ResearchPaper

db = SessionLocal()
users = db.query(User).all()

print(f"Total Users: {len(users)}")
for user in users:
    print(f"ID: {user.id}, Email: {user.email}, HashedPassword: {user.password_hash[:20]}...")
