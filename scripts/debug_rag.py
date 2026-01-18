
import sys
import os
import pickle
import numpy as np

# Add backend to path
sys.path.append('/home/agentrogue/Engunity/backend')

from app.services.ai.vector_store import vector_store

def test_search(query, user_id=None, session_id=None):
    print(f"\n--- Testing Search ---")
    print(f"Query: {query}")
    print(f"User ID: {user_id}")
    print(f"Session ID: {session_id}")

    results = vector_store.search(query, user_id=user_id, session_id=session_id, k=5)
    print(f"Found {len(results)} results")
    for i, res in enumerate(results):
        print(f"\nResult {i+1}:")
        print(f"  Score: {res['score']}")
        print(f"  Filename: {res['metadata'].get('filename')}")
        print(f"  Session ID: {res['metadata'].get('session_id')}")
        print(f"  Content snippet: {res['content'][:100]}...")

if __name__ == "__main__":
    # Test with the metadata we found
    # We found chunks for chat_architecture.md with user_id 3 and session_id da49f3ad-96d3-420a-b74b-3e9fb0cb2c62
    test_search("What is in chat_architecture.md", user_id="3", session_id="da49f3ad-96d3-420a-b74b-3e9fb0cb2c62")

    # Test without session_id (to see if it hits)
    test_search("What is in chat_architecture.md", user_id="3", session_id="some-other-session")

    # Test with different user_id
    test_search("What is in chat_architecture.md", user_id="1")
