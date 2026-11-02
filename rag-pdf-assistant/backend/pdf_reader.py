from io import BytesIO

from pypdf import PdfReader


def extract_pdf_text(contents: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(contents))
        pages = [page.extract_text() or "" for page in reader.pages]
    except Exception as error:
        raise ValueError("The uploaded file could not be read as a PDF.") from error

    return "\n\n".join(page.strip() for page in pages if page.strip())