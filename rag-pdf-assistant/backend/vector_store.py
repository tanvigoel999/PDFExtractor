import faiss
import numpy as np


class VectorStore:
    def __init__(self) -> None:
        self._index: faiss.IndexFlatIP | None = None
        self._chunks: list[str] = []
        self._sources: list[str] = []

    @property
    def document_count(self) -> int:
        return len(self._chunks)

    def add(self, source: str, chunks: list[str], vectors: np.ndarray) -> None:
        if not chunks or vectors.ndim != 2 or vectors.shape[0] != len(chunks):
            raise ValueError("Each chunk must have one embedding vector.")

        if self._index is None:
            self._index = faiss.IndexFlatIP(vectors.shape[1])
        elif self._index.d != vectors.shape[1]:
            raise ValueError("Embedding dimensions do not match the existing index.")

        self._index.add(vectors)
        self._chunks.extend(chunks)
        self._sources.extend([source] * len(chunks))

    def search(self, vector: np.ndarray, limit: int = 4) -> list[dict[str, str | float]]:
        if self._index is None or self._index.ntotal == 0:
            return []

        scores, indices = self._index.search(vector, min(limit, self._index.ntotal))
        return [
            {
                "text": self._chunks[index],
                "source": self._sources[index],
                "score": float(score),
            }
            for score, index in zip(scores[0], indices[0])
            if index >= 0
        ]