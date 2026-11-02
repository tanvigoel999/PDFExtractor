# Folio PDF Assistant

A local PDF question-answering starter with a FastAPI backend and a React + TypeScript frontend. Documents are embedded with Sentence Transformers and searched with FAISS. Set an OpenAI API key to generate concise answers from retrieved passages; without one, the API returns the matching excerpts directly.

## Structure

```text
rag-pdf-assistant/
├── backend/
│   ├── main.py
│   ├── pdf_reader.py
│   ├── chunking.py
│   ├── embeddings.py
│   ├── vector_store.py
│   ├── rag.py
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    └── React + TypeScript (Vite)
```

## Run locally

Backend (Python 3.10+ recommended):

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload
```

Frontend, in a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal. The API listens on `http://localhost:8000`; its interactive API documentation is at `http://localhost:8000/docs`. To enable generated answers, add an `OPENAI_API_KEY` to `backend/.env`.

Uploaded PDFs and the FAISS index are held in memory and are cleared when the backend restarts. Scanned PDFs require OCR, which is not included in this starter.