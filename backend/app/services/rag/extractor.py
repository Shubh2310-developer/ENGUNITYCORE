import json
from typing import List, Dict, Tuple, Any
from loguru import logger

class EntityExtractor:
    """
    Extracts entities and relationships from text using an LLM.
    """
    def __init__(self, llm_client):
        self.llm = llm_client

    async def extract_from_text(self, text: str, document_id: str) -> Tuple[List[Dict], List[Dict]]:
        """
        Extract entities and relationships from the provided text.
        """
        # Limit text length to avoid token issues for now
        truncated_text = text[:4000]

        prompt = f"""Extract key entities and their relationships from the following text.
Return the result as a JSON object with two keys: "entities" and "relationships".

Each entity should have: "id" (kebab-case), "name", "type" (person, organization, concept, location, etc.), and "description".
Each relationship should have: "source" (entity id), "target" (entity id), "relation" (type of relation), and "description".

Text:
{truncated_text}

JSON Result:"""

        try:
            response = await self.llm.get_completion(
                [{"role": "system", "content": "You are an expert at information extraction and knowledge graph construction. Always return valid JSON."},
                 {"role": "user", "content": prompt}],
                temperature=0.1
            )

            # Attempt to parse JSON from response
            # Sometimes LLMs add markdown code blocks
            json_str = response.strip()
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()

            data = json.loads(json_str)
            entities = data.get("entities", [])
            relationships = data.get("relationships", [])

            # Add document_id to metadata
            for entity in entities:
                entity['document_id'] = document_id

            return entities, relationships

        except Exception as e:
            logger.error(f"Error extracting entities: {e}")
            return [], []
