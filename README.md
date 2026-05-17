# DocFlow

An automated document intake and classification pipeline that simulates **AWS Textract** and **AWS Bedrock Data Automation** for an Enterprise Content Management (ECM) system.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DocFlow Pipeline                            │
│                                                                      │
│   Browser (React Dashboard)  or  Direct API Client                  │
│              │                                                       │
│              ▼  POST /upload (PDF or image)                          │
│   ┌──────────────────────┐                                           │
│   │   FastAPI  (api/)    │  ← CORS-enabled, /health + /upload        │
│   └──────────┬───────────┘                                           │
│              │                                                       │
│              ▼                                                       │
│   ┌──────────────────────┐   Mock AWS Textract                       │
│   │  Extractor           │   pdfplumber  → PDF text                  │
│   │  (pipeline/)         │   pytesseract → image OCR                 │
│   │                      │   → {raw_text, page_count,                │
│   │  MockTextractClient  │      source, confidence}                  │
│   └──────────┬───────────┘                                           │
│              │                                                       │
│              ▼                                                       │
│   ┌──────────────────────┐   Mock AWS Bedrock Data Automation        │
│   │  Classifier          │   Anthropic claude-sonnet                 │
│   │  (pipeline/)         │   Classifies into 6 document types        │
│   │                      │   → {document_type, confidence,           │
│   │  MockBedrockClient   │      extracted_fields, summary}           │
│   └──────────┬───────────┘                                           │
│              │                                                       │
│              ▼                                                       │
│   ┌──────────────────────┐   Routes to typed output queue            │
│   │  Router              │   output/{invoices,contracts,...}/         │
│   │  (router/)           │   Writes file + JSONL audit log           │
│   └──────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| API server | FastAPI 0.115 + Uvicorn |
| Text extraction (PDF) | pdfplumber |
| Text extraction (images) | pytesseract + Pillow |
| AI classification | Anthropic claude-sonnet (`anthropic` SDK) |
| Document routing | Python pathlib + JSONL audit log |
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Sample docs | reportlab |
| Tests | pytest + pytest-cov |
| Lint | flake8 |
| CI | GitHub Actions |

## Setup

### 1. Clone & install Python dependencies

```bash
git clone <repo-url>
cd docflow
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set your key:
# ANTHROPIC_API_KEY=sk-ant-...
```

### 3. (Optional) Generate sample documents

```bash
python sample_docs/create_samples.py
# Writes: sample_docs/invoice_sample.pdf
#         sample_docs/loan_application_sample.pdf
#         sample_docs/bank_statement_sample.pdf
```

### 4. Start the FastAPI backend

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### 5. Start the React dashboard

```bash
cd dashboard
npm install       # first time only
npm run dev
```

Dashboard: http://localhost:5173

## Running Tests

```bash
pytest --cov=api --cov=pipeline --cov=router --cov-report=term-missing
```

## Linting

```bash
flake8 api/ pipeline/ router/ --max-line-length=100
```

## Document Types & Output Queues

| Document Type | Output Queue Folder |
|---------------|---------------------|
| `invoice` | `output/invoices/` |
| `loan_application` | `output/loan_applications/` |
| `government_id` | `output/government_ids/` |
| `contract` | `output/contracts/` |
| `bank_statement` | `output/bank_statements/` |
| `unknown` | `output/unknown/` |

Each folder contains the routed file and a `routing_log.jsonl` audit log with per-document records (filename, type, timestamp, metadata).

## API Reference

### `POST /upload`

Upload a PDF or image for processing.

**Request:** `multipart/form-data` with field `file` (PDF, PNG, JPEG, TIFF, BMP).

**Response:**
```json
{
  "filename": "invoice_q1.pdf",
  "extracted_text": "INVOICE\nVendor: Acme Corp...",
  "document_type": "invoice",
  "confidence": 0.97,
  "extracted_fields": {
    "vendor": "Acme Corp",
    "amount": "$1,234.56",
    "date": "2024-01-15",
    "invoice_number": "INV-001",
    "due_date": "2024-02-15"
  },
  "summary": "Invoice from Acme Corp for $1,234.56 due 2024-02-15.",
  "routed_to": "invoices",
  "destination": "output/invoices/20240115T120000Z_invoice_q1.pdf",
  "timestamp": "2024-01-15T12:00:00+00:00"
}
```

### `GET /health`

```json
{"status": "ok", "service": "DocFlow"}
```

## Swapping Mock Clients for Real AWS in Production

The mock clients are drop-in compatible with the real AWS SDK interfaces.

### Replace `MockTextractClient` → boto3 Textract

In `pipeline/extractor.py`, replace `MockTextractClient` with:

```python
import boto3

class TextractClient:
    def __init__(self, region_name: str = "us-east-1"):
        self.client = boto3.client("textract", region_name=region_name)

    def analyze_document(self, document_bytes: bytes, filename: str = "") -> dict:
        resp = self.client.analyze_document(
            Document={"Bytes": document_bytes},
            FeatureTypes=["FORMS", "TABLES"],
        )
        blocks = resp.get("Blocks", [])
        lines = [b["Text"] for b in blocks if b["BlockType"] == "LINE"]
        return {
            "raw_text": "\n".join(lines),
            "page_count": resp.get("DocumentMetadata", {}).get("Pages", 1),
            "source": "textract",
            "confidence": 0.99,
        }
```

And update `api/main.py` to import and use `TextractClient` instead of calling `extract_text` directly.

### Replace `MockBedrockClient` → boto3 Bedrock Runtime

In `pipeline/classifier.py`, replace `MockBedrockClient` with:

```python
import boto3, json

class BedrockClient:
    def __init__(self, region_name: str = "us-east-1"):
        self.client = boto3.client("bedrock-runtime", region_name=region_name)

    def invoke_model(self, model_id: str, body: dict) -> dict:
        resp = self.client.invoke_model(
            modelId=model_id,
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json",
        )
        return json.loads(resp["body"].read())
```

You will also need the appropriate IAM role/policy granting `textract:AnalyzeDocument` and `bedrock:InvokeModel` permissions.
