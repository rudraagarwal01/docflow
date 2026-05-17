import json
import pytest
from unittest.mock import MagicMock, patch
from pipeline.classifier import classify_document, MockBedrockClient, DOCUMENT_TYPES


MOCK_INVOICE_JSON = json.dumps({
    "document_type": "invoice",
    "confidence": 0.97,
    "extracted_fields": {
        "vendor": "Acme Corp",
        "amount": "$1,234.56",
        "date": "2024-01-15",
        "invoice_number": "INV-001",
        "due_date": "2024-02-15",
    },
    "summary": "Invoice from Acme Corp for $1,234.56 due 2024-02-15.",
})

MOCK_LOAN_JSON = json.dumps({
    "document_type": "loan_application",
    "confidence": 0.95,
    "extracted_fields": {
        "applicant_name": "James R. Thornton",
        "loan_amount": "$485,000",
        "property_address": "1452 Oakwood Drive, Naperville, IL 60540",
        "loan_type": "Conventional 30-Year Fixed",
        "date": "2024-01-15",
    },
    "summary": "Loan application for $485,000 from James R. Thornton.",
})


def _make_message(text: str):
    msg = MagicMock()
    block = MagicMock()
    block.text = text
    msg.content = [block]
    return msg


@patch("pipeline.classifier.anthropic.Anthropic")
def test_classify_invoice(MockClient):
    MockClient.return_value.messages.create.return_value = _make_message(MOCK_INVOICE_JSON)
    result = classify_document("Invoice from Acme Corp. Amount: $1,234.56")
    assert result["document_type"] == "invoice"
    assert result["confidence"] == 0.97
    assert result["extracted_fields"]["vendor"] == "Acme Corp"
    assert "summary" in result


@patch("pipeline.classifier.anthropic.Anthropic")
def test_classify_loan_application(MockClient):
    MockClient.return_value.messages.create.return_value = _make_message(MOCK_LOAN_JSON)
    result = classify_document("Residential Loan Application")
    assert result["document_type"] == "loan_application"
    assert result["extracted_fields"]["applicant_name"] == "James R. Thornton"


@patch("pipeline.classifier.anthropic.Anthropic")
def test_invalid_document_type_normalized_to_unknown(MockClient):
    bad = json.dumps({
        "document_type": "spreadsheet",
        "confidence": 0.3,
        "extracted_fields": {},
        "summary": "Unknown.",
    })
    MockClient.return_value.messages.create.return_value = _make_message(bad)
    result = classify_document("random text")
    assert result["document_type"] == "unknown"


def test_document_types_list():
    assert set(DOCUMENT_TYPES) == {
        "invoice", "loan_application", "government_id",
        "contract", "bank_statement", "unknown",
    }


@patch("pipeline.classifier.anthropic.Anthropic")
def test_mock_bedrock_client_invoke_model(MockClient):
    MockClient.return_value.messages.create.return_value = _make_message(MOCK_INVOICE_JSON)
    client = MockBedrockClient()
    result = client.invoke_model("anthropic.claude-v3-sonnet", {"text": "Invoice text"})
    assert result["document_type"] == "invoice"
