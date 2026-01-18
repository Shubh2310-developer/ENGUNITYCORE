from typing import List
import re

class SemanticChunker:
    """
    Implements recursive character splitting to maintain logical context.
    Ensures that logical paragraphs and sections remain intact.
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = ["\n\n", "\n", " ", ""]

    def split_text(self, text: str) -> List[str]:
        """
        Splits text into chunks using recursive character splitting.
        """
        if not text:
            return []

        return self._recursive_split(text, self.separators)

    def _recursive_split(self, text: str, separators: List[str]) -> List[str]:
        """
        Internal recursive method to split text.
        """
        final_chunks = []

        # If text is already smaller than chunk size, return it
        if len(text) <= self.chunk_size:
            return [text]

        # Find the best separator to use
        separator = separators[0] if separators else ""
        new_separators = separators[1:] if len(separators) > 1 else []

        splits = text.split(separator) if separator else list(text)

        current_chunk = ""
        for s in splits:
            if len(current_chunk) + len(s) + len(separator) <= self.chunk_size:
                current_chunk += (separator if current_chunk else "") + s
            else:
                if current_chunk:
                    # If current_chunk is too big, we might need to split it further
                    if len(current_chunk) > self.chunk_size:
                        final_chunks.extend(self._recursive_split(current_chunk, new_separators))
                    else:
                        final_chunks.append(current_chunk)

                # Start new chunk with overlap if possible
                if self.chunk_overlap > 0 and current_chunk:
                    overlap_start = max(0, len(current_chunk) - self.chunk_overlap)
                    current_chunk = current_chunk[overlap_start:] + (separator if current_chunk else "") + s
                else:
                    current_chunk = s

        if current_chunk:
            final_chunks.append(current_chunk)

        return final_chunks

def get_chunker(method: str = "recursive", **kwargs):
    if method == "recursive":
        return SemanticChunker(**kwargs)
    elif method == "semantic":
        return LlamaIndexSemanticChunker(**kwargs)
    raise ValueError(f"Unknown chunking method: {method}")


# Advanced semantic chunking using LlamaIndex
try:
    from llama_index.core.node_parser import SemanticSplitterNodeParser
    from llama_index.embeddings.huggingface import HuggingFaceEmbedding
    from llama_index.core import Document as LlamaDocument
    from typing import Dict
    
    class LlamaIndexSemanticChunker:
        """
        Advanced semantic chunking using LlamaIndex
        Breaks text at semantic boundaries instead of arbitrary characters
        """
        
        def __init__(
            self,
            buffer_size: int = 1,
            breakpoint_percentile_threshold: int = 95,
            embed_model_name: str = "BAAI/bge-large-en-v1.5"
        ):
            # Initialize BGE embeddings
            self.embed_model = HuggingFaceEmbedding(
                model_name=embed_model_name,
                embed_batch_size=32
            )
            
            # Create semantic splitter
            self.splitter = SemanticSplitterNodeParser(
                buffer_size=buffer_size,
                breakpoint_percentile_threshold=breakpoint_percentile_threshold,
                embed_model=self.embed_model
            )
        
        def chunk_text(self, text: str, metadata: Dict = None) -> List[Dict]:
            """
            Split text at semantic boundaries
            
            Args:
                text: Text to chunk
                metadata: Metadata to attach to chunks
                
            Returns:
                List of chunks with contextual information
            """
            if not text:
                return []
                
            # Create LlamaIndex document
            document = LlamaDocument(text=text, metadata=metadata or {})
            
            # Split semantically
            nodes = self.splitter.get_nodes_from_documents([document])
            
            # Convert to our format with context
            chunks = []
            for i, node in enumerate(nodes):
                chunk = {
                    'text': node.get_content(),
                    'metadata': {
                        **(metadata or {}),
                        'chunk_id': i,
                        'total_chunks': len(nodes),
                        'position': f"Chunk {i+1} of {len(nodes)}"
                    },
                    'node_id': node.node_id,
                    'context': {
                        'previous': nodes[i-1].get_content()[:100] if i > 0 else None,
                        'next': nodes[i+1].get_content()[:100] if i < len(nodes)-1 else None
                    }
                }
                chunks.append(chunk)
            
            return chunks
        
        def split_text(self, text: str) -> List[str]:
            """Compatibility method - returns just text strings"""
            chunks = self.chunk_text(text)
            return [chunk['text'] for chunk in chunks]
        
        def create_contextual_text(self, chunk: Dict) -> str:
            """
            Add document context to chunk before embedding
            This improves retrieval accuracy significantly
            """
            parts = []
            
            # Add metadata context
            if chunk.get('metadata'):
                title = chunk['metadata'].get('title', '')
                if title:
                    parts.append(f"Document: {title}")
                
                position = chunk['metadata'].get('position', '')
                if position:
                    parts.append(f"Position: {position}")
            
            # Add previous context
            if chunk.get('context', {}).get('previous'):
                parts.append(f"Previous context: ...{chunk['context']['previous']}")
            
            # Add main content
            parts.append(f"Content: {chunk['text']}")
            
            # Add next context
            if chunk.get('context', {}).get('next'):
                parts.append(f"Following context: {chunk['context']['next']}...")
            
            return "\n".join(parts)
except ImportError:
    # LlamaIndex not installed, semantic chunker not available
    class LlamaIndexSemanticChunker:
        def __init__(self, **kwargs):
            raise ImportError("llama-index packages required for semantic chunking. Install with: pip install llama-index llama-index-embeddings-huggingface")
