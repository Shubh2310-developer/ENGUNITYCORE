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
    raise ValueError(f"Unknown chunking method: {method}")
