import asyncio
import os
from dotenv import load_dotenv
load_dotenv("/home/agentrogue/projects/ENGUNITYCORE/.env")

from app.api.v1.chat import get_chat_sessions
from app.core.database import SessionLocal
from app.api.v1.auth import AuthenticatedUser
from app.core.mongodb import connect_to_mongo

async def test_sessions():
    await connect_to_mongo()
    db = SessionLocal()
    # Mocking user context with ID 1 which hopefully maps to any test DB,
    # or just any integer to see if it even throws an exception
    mock_user = AuthenticatedUser(
        id=1, email="test@test.com", role="user", is_active=True, provider="supabase"
    )
    
    try:
        results = await get_chat_sessions(db=db, current_user=mock_user)
        print("SUCCESS:")
        for r in results:
            print(r.model_dump())
    except Exception as e:
        print("FAILED:", type(e))
        import traceback
        traceback.print_exc()
        
if __name__ == "__main__":
    asyncio.run(test_sessions())
