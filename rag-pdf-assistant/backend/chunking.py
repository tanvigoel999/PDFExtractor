def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    if chunk_size <= 0 or overlap < 0 or overlap >= chunk_size:
        raise ValueError("chunk_size must be positive and overlap must be smaller than chunk_size.")

    normalized_text = " ".join(text.split())
    chunks = []
    start = 0

    while start < len(normalized_text):
        end = min(start + chunk_size, len(normalized_text))
        if end < len(normalized_text):
            boundary = normalized_text.rfind(" ", start, end)
            if boundary > start:
                end = boundary
        chunk = normalized_text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(normalized_text):
            break
        start = end - overlap

    return chunks