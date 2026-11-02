import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from chunking import chunk_text
from pdf_reader import extract_pdf_text
from rag import RAGPipeline

load_dotenv()

app = FastAPI(title="RAG PDF Assistant", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = RAGPipeline()


class ChatRequest(BaseModel):
    question: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/documents")
async def upload_document(file: UploadFile = File(...)) -> dict[str, object]:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Upload a PDF file.")

    contents = await file.read()
    try:
        text = extract_pdf_text(contents)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="The PDF contains no extractable text.")

    pipeline.add_document(file.filename, chunks)
    return {"filename": file.filename, "chunks": len(chunks)}


@app.post("/chat")
def chat(request: ChatRequest) -> dict[str, object]:
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Enter a question.")
    if not pipeline.has_documents:
        raise HTTPException(status_code=400, detail="Upload a PDF before asking a question.")

    return pipeline.answer(question)