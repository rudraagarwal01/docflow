import io
from pathlib import Path

import pdfplumber
import pytesseract
from PIL import Image


def extract_text(file_bytes: bytes, filename: str) -> dict:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        return _extract_from_pdf(file_bytes)
    elif suffix in (".png", ".jpg", ".jpeg", ".tiff", ".bmp"):
        return _extract_from_image(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {suffix}")


def _extract_from_pdf(file_bytes: bytes) -> dict:
    pages = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text() or "")
    raw_text = "\n".join(pages)
    return {
        "raw_text": raw_text,
        "page_count": len(pages),
        "source": "pdfplumber",
        "confidence": 0.95 if raw_text.strip() else 0.0,
    }


def _extract_from_image(file_bytes: bytes) -> dict:
    image = Image.open(io.BytesIO(file_bytes))
    raw_text = pytesseract.image_to_string(image)
    return {
        "raw_text": raw_text,
        "page_count": 1,
        "source": "pytesseract",
        "confidence": 0.85 if raw_text.strip() else 0.0,
    }


class MockTextractClient:
    """Drop-in replacement for boto3 Textract client."""

    def analyze_document(self, document_bytes: bytes, filename: str = "document.pdf") -> dict:
        return extract_text(document_bytes, filename)
