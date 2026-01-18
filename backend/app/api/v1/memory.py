from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from app.api.v1.auth import get_current_user
from app.services.memory.system import memory_system

router = APIRouter(prefix="/memory", tags=["memory"])


class MemoryResponse(BaseModel):
    memory: str
    type: str
    metadata: dict


class UserProfileResponse(BaseModel):
    preferences: List[str]
    facts: List[str]
    recent_topics: List[str]
    technical_level: str
    conversation_count: int = 0


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(current_user = Depends(get_current_user)):
    """Get user's memory profile"""
    try:
        profile = await memory_system.get_user_profile(str(current_user.id))
        return UserProfileResponse(**profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")


@router.get("/search", response_model=List[MemoryResponse])
async def search_memories(
    query: str,
    limit: int = 5,
    current_user = Depends(get_current_user)
):
    """Search user's memories"""
    try:
        memories = await memory_system.recall(str(current_user.id), query, limit)
        return [
            MemoryResponse(
                memory=m.get('memory', ''),
                type=m.get('type', 'unknown'),
                metadata=m.get('metadata', {})
            )
            for m in memories
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search memories: {str(e)}")


@router.delete("/clear")
async def clear_memories(current_user = Depends(get_current_user)):
    """Clear all user memories"""
    try:
        await memory_system.clear_user_memories(str(current_user.id))
        return {"message": "All memories cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear memories: {str(e)}")


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, current_user = Depends(get_current_user)):
    """Delete specific memory"""
    try:
        await memory_system.delete_memory(str(current_user.id), memory_id)
        return {"message": f"Memory {memory_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete memory: {str(e)}")


@router.get("/stats")
async def get_memory_stats(current_user = Depends(get_current_user)):
    """Get memory statistics"""
    try:
        profile = await memory_system.get_user_profile(str(current_user.id))
        return {
            "total_conversations": profile.get('conversation_count', 0),
            "preferences_count": len(profile.get('preferences', [])),
            "facts_count": len(profile.get('facts', [])),
            "recent_topics_count": len(profile.get('recent_topics', [])),
            "technical_level": profile.get('technical_level', 'intermediate')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
