import json
import os
from typing import List, Dict, Any, Optional
import networkx as nx
from community import community_louvain
from loguru import logger

class KnowledgeGraph:
    """
    Advanced Knowledge Graph store for GraphRAG with community detection
    """
    def __init__(self, storage_path: str = None, llm_client = None):
        if storage_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            storage_path = os.path.join(base_dir, "storage", "knowledge_graph")

        self.storage_path = storage_path
        self.graph_file = os.path.join(storage_path, "graph.json")
        os.makedirs(storage_path, exist_ok=True)

        self.entities = {}
        self.relationships = []
        self.communities = {}
        self.community_summaries = {}
        self.llm = llm_client

        self.load()

    def add_entity(self, entity_id: str, name: str, type: str, description: str, metadata: Dict[str, Any] = None):
        self.entities[entity_id] = {
            "name": name,
            "type": type,
            "description": description,
            "metadata": metadata or {}
        }

    def add_relationship(self, source: str, target: str, relation: str, description: str):
        # Only add if both entities exist to keep graph integrity
        if source in self.entities and target in self.entities:
            self.relationships.append({
                "source": source,
                "target": target,
                "relation": relation,
                "description": description
            })

    def detect_communities(self):
        """
        Apply Louvain algorithm for community detection
        """
        if not self.relationships:
            return

        G = nx.Graph()
        for rel in self.relationships:
            G.add_edge(rel['source'], rel['target'], weight=1)

        # Handle isolated nodes
        for entity_id in self.entities:
            if entity_id not in G:
                G.add_node(entity_id)

        try:
            partition = community_louvain.best_partition(G)

            # Group nodes by community ID
            new_communities = {}
            for node, comm_id in partition.items():
                if comm_id not in new_communities:
                    new_communities[comm_id] = []
                new_communities[comm_id].append(node)

            self.communities = new_communities
            logger.info(f"Detected {len(self.communities)} communities in knowledge graph")
        except Exception as e:
            logger.error(f"Error in community detection: {e}")

    async def generate_community_summaries(self):
        """
        Use LLM to generate summaries for each community
        """
        if not self.llm or not self.communities:
            return

        for comm_id, nodes in self.communities.items():
            # Skip if already summarized and graph hasn't changed much (placeholder logic)
            if comm_id in self.community_summaries and len(self.community_summaries[comm_id]) > 50:
                continue

            entity_info = []
            for node in nodes[:20]: # Limit entities per community for summary
                entity = self.entities[node]
                entity_info.append(f"- {entity['name']} ({entity['type']}): {entity['description']}")

            prompt = f"""Summarize the following group of related entities into a comprehensive thematic overview.
Entities:
{chr(10).join(entity_info)}

Summary (focus on the collective significance):"""

            try:
                summary = await self.llm.get_completion(
                    [{"role": "system", "content": "You are a knowledge graph analyst. Create concise, thematic summaries of entity communities."},
                     {"role": "user", "content": prompt}],
                    max_tokens=300
                )
                self.community_summaries[str(comm_id)] = summary.strip()
            except Exception as e:
                logger.error(f"Error summarizing community {comm_id}: {e}")

    def search_communities(self, query: str, embedder = None, top_k: int = 5, user_id: str = None) -> List[Dict]:
        """
        Search for relevant communities based on descriptions.
        Uses semantic search if embedder is provided, else falls back to keyword matching.
        """
        results = []

        if not self.community_summaries:
            return []

        # Pre-filter communities by user_id if provided
        target_comm_ids = []
        for comm_id in self.community_summaries.keys():
            if user_id:
                # Handle both string and int keys for communities
                lookup_id = int(comm_id) if comm_id.isdigit() else comm_id
                nodes = self.communities.get(str(comm_id), self.communities.get(lookup_id, []))

                is_user_community = False
                for node in nodes:
                    if self.entities.get(node, {}).get('metadata', {}).get('user_id') == str(user_id):
                        is_user_community = True
                        break
                if not is_user_community:
                    continue
            target_comm_ids.append(comm_id)

        if not target_comm_ids:
            return []

        if embedder:
            try:
                # Semantic search on filtered communities
                summaries = [self.community_summaries[cid] for cid in target_comm_ids]

                query_vec = embedder.encode([query])[0]
                summary_vecs = embedder.encode(summaries)

                # Simple cosine similarity
                import numpy as np
                query_vec = query_vec / (np.linalg.norm(query_vec) + 1e-9)
                summary_vecs = summary_vecs / (np.linalg.norm(summary_vecs, axis=1, keepdims=True) + 1e-9)

                similarities = np.dot(summary_vecs, query_vec)

                for i, score in enumerate(similarities):
                    if score > 0.2: # Lowered threshold slightly for better recall
                        results.append({
                            "community_id": target_comm_ids[i],
                            "summary": summaries[i],
                            "entity_count": len(self.communities.get(int(target_comm_ids[i]) if target_comm_ids[i].isdigit() else target_comm_ids[i], [])),
                            "score": float(score)
                        })
            except Exception as e:
                logger.error(f"Error in semantic community search: {e}")

        if not results:
            # Keyword matching fallback
            query_lower = query.lower()
            for comm_id in target_comm_ids:
                summary = self.community_summaries[comm_id]
                score = 0
                for word in query_lower.split():
                    if len(word) > 3 and word in summary.lower():
                        score += 1

                if score > 0:
                    results.append({
                        "community_id": comm_id,
                        "summary": summary,
                        "entity_count": len(self.communities.get(int(comm_id) if comm_id.isdigit() else comm_id, [])),
                        "score": score
                    })

        # Sort by match score
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]

    def save(self):
        data = {
            "entities": self.entities,
            "relationships": self.relationships,
            "communities": self.communities,
            "community_summaries": self.community_summaries
        }
        with open(self.graph_file, 'w') as f:
            json.dump(data, f, indent=2)

    def load(self):
        if os.path.exists(self.graph_file):
            try:
                with open(self.graph_file, 'r') as f:
                    data = json.load(f)
                    self.entities = data.get("entities", {})
                    self.relationships = data.get("relationships", [])
                    self.communities = data.get("communities", {})
                    self.community_summaries = data.get("community_summaries", {})
            except Exception as e:
                logger.error(f"Error loading graph: {e}")
