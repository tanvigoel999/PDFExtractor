import os

from embeddings import EmbeddingService
from vector_store import VectorStore


class RAGPipeline:
    def __init__(self) -> None:
        self._embeddings: EmbeddingService | None = None
        self._store = VectorStore()

    @property
    def has_documents(self) -> bool:
        return self._store.document_count > 0

    def add_document(self, source: str, chunks: list[str]) -> None:
        self._store.add(source, chunks, self._get_embeddings().encode(chunks))

    def answer(self, question: str) -> dict[str, object]:
        matches = self._store.search(self._get_embeddings().encode([question]), limit=4)
        if not matches:
            return {"answer": "I could not find a relevant passage in the uploaded PDFs.", "sources": []}

        answer = self._generate_answer(question, matches)
        return {"answer": answer, "sources": matches}

    def _get_embeddings(self) -> EmbeddingService:
        if self._embeddings is None:
            self._embeddings = EmbeddingService()
        return self._embeddings

    @staticmethod
    def _generate_answer(question: str, matches: list[dict[str, str | float]]) -> str:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            excerpts = "\n\n".join(
                f"[{match['source']}] {match['text']}" for match in matches
            )
            return f"Relevant passages from your documents:\n\n{excerpts}"

        from openai import OpenAI

        context = "\n\n".join(
            f"Source: {match['source']}\n{match['text']}" for match in matches
        )
        response = OpenAI(api_key=api_key).chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {
                    "role": "system",
                    "content": "Answer using only the supplied document excerpts. Cite sources by filename. If the excerpts do not contain the answer, say so.",
                },
                {"role": "user", "content": f"Question: {question}\n\nExcerpts:\n{context}"},
            ],
        )
        return response.choices[0].message.content or "No answer was returned."