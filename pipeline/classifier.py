import json
import os
from typing import Optional

import anthropic
from dotenv import load_dotenv

load_dotenv()

DOCUMENT_TYPES = [
    "invoice",
    "loan_application",
    "government_id",
    "contract",
    "bank_statement",
    "unknown",
]

_SYSTEM_PROMPT = (
    "You are a document classification system for an Enterprise Content Management platform. "
    "Analyze document text and respond ONLY with valid JSON — no markdown, no explanation."
)

_USER_TEMPLATE = """Classify this document into one of: invoice, loan_application, government_id, contract, bank_statement, unknown.

Extract relevant structured fields:
- invoice: vendor, amount, date, invoice_number, due_date
- loan_application: applicant_name, loan_amount, property_address, loan_type, date
- government_id: id_type, name, id_number, expiry_date, issuing_authority
- contract: parties, effective_date, expiry_date, contract_type, value
- bank_statement: account_holder, account_number, bank_name, period, closing_balance
- unknown: any fields you can identify

Respond with exactly this JSON structure:
{{
  "document_type": "<type>",
  "confidence": <float 0.0-1.0>,
  "extracted_fields": {{}},
  "summary": "<one sentence>"
}}

Document text:
{text}"""


def classify_document(extracted_text: str, api_key: Optional[str] = None) -> dict:
    key = api_key or os.getenv("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=key)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": _USER_TEMPLATE.format(text=extracted_text[:4000])}
        ],
    )

    result = json.loads(message.content[0].text)
    if result.get("document_type") not in DOCUMENT_TYPES:
        result["document_type"] = "unknown"
    return result


class MockBedrockClient:
    """Drop-in replacement for boto3 Bedrock Runtime client."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    def invoke_model(self, model_id: str, body: dict) -> dict:
        return classify_document(body.get("text", ""), api_key=self.api_key)
