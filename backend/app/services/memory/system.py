from typing import Dict, List, Optional
import logging
import json
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class HierarchicalMemory:
    """
    ChatGPT-level memory system
    
    Three types of memory:
    1. Episodic: What happened (recent conversations)
    2. Semantic: What you know (facts, entities, user info)
    3. Procedural: How to do things (user preferences, patterns)
    """
    
    def __init__(self, use_mem0: bool = False):
        """
        Initialize memory system
        
        Args:
            use_mem0: If True, use Mem0 framework (requires additional setup)
                      If False, use simple file-based storage
        """
        self.use_mem0 = use_mem0
        self.storage_path = "./storage/memory"
        
        if use_mem0:
            try:
                from mem0 import Memory
                
                # Use simple config with Gemini
                from app.core.config import settings
                config = {
                    "version": "v1.1",
                    "llm": {
                        "provider": "google",
                        "config": {
                            "model": "gemini-2.0-flash-exp",
                            "api_key": settings.GEMINI_API_KEY,
                            "temperature": 0.1
                        }
                    },
                    "embedder": {
                        "provider": "huggingface",
                        "config": {
                            "model": "BAAI/bge-large-en-v1.5"
                        }
                    }
                }
                
                self.memory = Memory.from_config(config)
                logger.info("✅ Memory system initialized with Mem0")
            except ImportError:
                logger.warning("Mem0 not available, falling back to simple storage")
                self.use_mem0 = False
                self._init_simple_storage()
        else:
            self._init_simple_storage()
    
    def _init_simple_storage(self):
        """Initialize simple file-based storage"""
        os.makedirs(self.storage_path, exist_ok=True)
        logger.info("✅ Memory system initialized with simple storage")
    
    def _get_user_file(self, user_id: str) -> str:
        """Get path to user's memory file"""
        return os.path.join(self.storage_path, f"user_{user_id}.json")
    
    def _load_user_memories(self, user_id: str) -> Dict:
        """Load user memories from file"""
        file_path = self._get_user_file(user_id)
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        return {
            'conversations': [],
            'preferences': [],
            'facts': [],
            'recent_topics': []
        }
    
    def _save_user_memories(self, user_id: str, memories: Dict):
        """Save user memories to file"""
        file_path = self._get_user_file(user_id)
        with open(file_path, 'w') as f:
            json.dump(memories, f, indent=2)
    
    async def remember(
        self, 
        user_id: str, 
        message: str, 
        response: str,
        metadata: Optional[Dict] = None
    ):
        """
        Store interaction and extract memories
        """
        if self.use_mem0:
            messages = [
                {"role": "user", "content": message},
                {"role": "assistant", "content": response}
            ]
            
            if metadata:
                messages[0]["metadata"] = metadata
            
            self.memory.add(messages=messages, user_id=user_id)
        else:
            # Simple storage
            memories = self._load_user_memories(user_id)
            
            # Store conversation
            memories['conversations'].append({
                'timestamp': datetime.now().isoformat(),
                'message': message,
                'response': response,
                'metadata': metadata or {}
            })
            
            # Keep only last 50 conversations
            memories['conversations'] = memories['conversations'][-50:]
            
            # Extract preferences and facts (simple keyword-based)
            self._extract_insights(memories, message, response)
            
            self._save_user_memories(user_id, memories)
        
        logger.info(f"Stored memory for user {user_id}")
    
    def _extract_insights(self, memories: Dict, message: str, response: str):
        """Simple insight extraction"""
        text = (message + " " + response).lower()
        
        # Extract preferences
        if any(word in text for word in ['prefer', 'like', 'favorite', 'love']):
            insight = f"Preference: {message[:100]}"
            if insight not in memories['preferences']:
                memories['preferences'].append(insight)
                memories['preferences'] = memories['preferences'][-20:]  # Keep last 20
        
        # Extract topics
        if any(word in text for word in ['working on', 'project', 'building', 'learning']):
            topic = message[:100]
            if topic not in memories['recent_topics']:
                memories['recent_topics'].append(topic)
                memories['recent_topics'] = memories['recent_topics'][-10:]  # Keep last 10
    
    async def recall(
        self, 
        user_id: str, 
        query: str, 
        limit: int = 5
    ) -> List[Dict]:
        """
        Retrieve relevant memories for context
        
        Returns:
            List of relevant memories
        """
        if self.use_mem0:
            memories = self.memory.search(
                query=query,
                user_id=user_id,
                limit=limit
            )
            return memories
        else:
            # Simple keyword-based search
            memories = self._load_user_memories(user_id)
            relevant = []
            
            query_lower = query.lower()
            
            # Search recent conversations
            for conv in reversed(memories['conversations'][-20:]):
                if any(word in conv['message'].lower() for word in query_lower.split()):
                    relevant.append({
                        'memory': conv['message'],
                        'type': 'conversation',
                        'metadata': conv.get('metadata', {})
                    })
                    if len(relevant) >= limit:
                        break
            
            return relevant
    
    async def get_user_profile(self, user_id: str) -> Dict:
        """
        Get summarized user profile
        
        Returns:
            Categorized memories (preferences, facts, recent topics)
        """
        if self.use_mem0:
            all_memories = self.memory.get_all(user_id=user_id)
            
            profile = {
                'preferences': [],
                'facts': [],
                'recent_topics': [],
                'technical_level': 'intermediate',
            }
            
            for mem in all_memories:
                memory_text = mem.get('memory', '')
                
                if any(word in memory_text.lower() for word in ['prefer', 'like', 'favorite']):
                    profile['preferences'].append(memory_text)
                elif any(word in memory_text.lower() for word in ['is working on', 'project']):
                    profile['recent_topics'].append(memory_text)
                else:
                    profile['facts'].append(memory_text)
            
            return profile
        else:
            memories = self._load_user_memories(user_id)
            return {
                'preferences': memories.get('preferences', []),
                'facts': memories.get('facts', []),
                'recent_topics': memories.get('recent_topics', []),
                'technical_level': 'intermediate',
                'conversation_count': len(memories.get('conversations', []))
            }
    
    async def update_memory(
        self, 
        user_id: str, 
        memory_id: str, 
        new_content: str
    ):
        """Update existing memory"""
        if self.use_mem0:
            self.memory.update(
                memory_id=memory_id,
                data=new_content,
                user_id=user_id
            )
        else:
            logger.warning("Update memory not supported in simple storage mode")
    
    async def delete_memory(self, user_id: str, memory_id: str):
        """Delete specific memory"""
        if self.use_mem0:
            self.memory.delete(memory_id=memory_id, user_id=user_id)
        else:
            logger.warning("Delete memory not supported in simple storage mode")
    
    async def clear_user_memories(self, user_id: str):
        """Clear all memories for a user"""
        if self.use_mem0:
            self.memory.delete_all(user_id=user_id)
        else:
            file_path = self._get_user_file(user_id)
            if os.path.exists(file_path):
                os.remove(file_path)
        
        logger.info(f"Cleared all memories for user {user_id}")


# Create singleton instance (using simple storage by default)
memory_system = HierarchicalMemory(use_mem0=False)
