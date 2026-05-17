import pytest
from pipeline.extractor import extract_text, MockTextractClient


def test_extract_pdf_returns_correct_shape(sample_pdf_bytes):
    result = extract_text(sample_pdf_bytes, "test.pdf")
    assert set(result.keys()) == {"raw_text", "page_count", "source", "confidence"}


def test_extract_pdf_source_is_pdfplumber(sample_pdf_bytes):
    result = extract_text(sample_pdf_bytes, "test.pdf")
    assert result["source"] == "pdfplumber"


def test_extract_pdf_page_count(sample_pdf_bytes):
    result = extract_text(sample_pdf_bytes, "test.pdf")
    assert result["page_count"] == 1


def test_extract_pdf_confidence_float(sample_pdf_bytes):
    result = extract_text(sample_pdf_bytes, "test.pdf")
    assert isinstance(result["confidence"], float)
    assert 0.0 <= result["confidence"] <= 1.0


def test_extract_pdf_text_nonempty(sample_pdf_bytes):
    result = extract_text(sample_pdf_bytes, "test.pdf")
    assert len(result["raw_text"].strip()) > 0


def test_extract_unsupported_type_raises():
    with pytest.raises(ValueError, match="Unsupported file type"):
        extract_text(b"data", "doc.docx")


def test_mock_textract_client_analyze_document(sample_pdf_bytes):
    client = MockTextractClient()
    result = client.analyze_document(sample_pdf_bytes, "test.pdf")
    assert "raw_text" in result
    assert "page_count" in result
    assert "source" in result
    assert "confidence" in result
