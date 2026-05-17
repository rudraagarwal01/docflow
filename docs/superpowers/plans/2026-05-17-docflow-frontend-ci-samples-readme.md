# DocFlow — Frontend, CI, Sample Docs & README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the DocFlow project by adding the React dashboard, GitHub Actions CI, two sample PDFs, and a README — everything listed in the spec that isn't yet on disk.

**Architecture:** The React app (Vite + Tailwind) is a standalone SPA in `dashboard/` that POSTs to `http://localhost:8000/upload` and displays pipeline-status animations followed by structured results. CI runs flake8 lint, pytest with coverage, and a Node build-check on every push/PR to main. Sample PDFs are generated once via a small Python script using reportlab and committed as static files.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, Python 3.11, GitHub Actions, reportlab

---

## File Map

| File | Role |
|------|------|
| `dashboard/package.json` | Node project manifest + Vite/React/Tailwind deps |
| `dashboard/vite.config.js` | Vite configuration |
| `dashboard/index.html` | HTML entry point |
| `dashboard/tailwind.config.js` | Tailwind config |
| `dashboard/postcss.config.js` | PostCSS config for Tailwind |
| `dashboard/src/main.jsx` | React root mount |
| `dashboard/src/index.css` | Tailwind directives |
| `dashboard/src/App.jsx` | Full UI: drag-drop upload, progress steps, results card |
| `.github/workflows/ci.yml` | lint → test → build-check |
| `sample_docs/create_samples.py` | reportlab script that generates the two PDFs |
| `sample_docs/invoice_sample.pdf` | Committed sample invoice PDF |
| `sample_docs/loan_application_sample.pdf` | Committed sample loan application PDF |
| `README.md` | Project overview, ASCII diagram, setup, production swap guide |

---

## Task 1: React Dashboard Scaffold

**Files:**
- Create: `dashboard/package.json`
- Create: `dashboard/vite.config.js`
- Create: `dashboard/index.html`
- Create: `dashboard/tailwind.config.js`
- Create: `dashboard/postcss.config.js`
- Create: `dashboard/src/main.jsx`
- Create: `dashboard/src/index.css`

- [ ] **Step 1: Create `dashboard/package.json`**

```json
{
  "name": "docflow-dashboard",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "vite": "^5.4.8"
  }
}
```

- [ ] **Step 2: Create `dashboard/vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
```

- [ ] **Step 3: Create `dashboard/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DocFlow</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `dashboard/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Create `dashboard/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create `dashboard/src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 7: Create `dashboard/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Install Node dependencies**

Run from `dashboard/`:
```bash
cd dashboard && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 9: Verify build works**

```bash
cd dashboard && npm run build
```

Expected: `dist/` folder created, no errors.

- [ ] **Step 10: Commit scaffold**

```bash
git add dashboard/package.json dashboard/package-lock.json dashboard/vite.config.js \
        dashboard/index.html dashboard/tailwind.config.js dashboard/postcss.config.js \
        dashboard/src/main.jsx dashboard/src/index.css
git commit -m "feat: add React+Vite+Tailwind dashboard scaffold"
```

---

## Task 2: App.jsx — Full UI

**Files:**
- Create: `dashboard/src/App.jsx`

- [ ] **Step 1: Create `dashboard/src/App.jsx`**

```jsx
import { useState, useRef, useCallback } from 'react'

const API = 'http://localhost:8000'

const STEPS = ['Extracting', 'Classifying', 'Routing', 'Complete']

const TYPE_COLORS = {
  invoice: 'bg-blue-100 text-blue-800',
  loan_application: 'bg-purple-100 text-purple-800',
  government_id: 'bg-green-100 text-green-800',
  contract: 'bg-amber-100 text-amber-800',
  bank_statement: 'bg-teal-100 text-teal-800',
  unknown: 'bg-gray-100 text-gray-800',
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Confidence</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center gap-2 my-6">
      {STEPS.map((step, i) => {
        const stepIdx = STEPS.indexOf(currentStep)
        const done = i < stepIdx
        const active = i === stepIdx
        return (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold
              ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-200 text-gray-500'}`}>
              {done ? '✓' : i + 1}
            </div>
            <span className={`ml-1 text-sm ${active ? 'font-semibold text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
              {step}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 w-6 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ResultCard({ result }) {
  const badge = TYPE_COLORS[result.document_type] || TYPE_COLORS.unknown
  const label = result.document_type.replace('_', ' ')
  return (
    <div className="mt-6 bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{result.filename}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${badge}`}>{label}</span>
      </div>

      <ConfidenceBar value={result.confidence} />

      {result.summary && (
        <p className="mt-4 text-sm text-gray-600 italic">{result.summary}</p>
      )}

      {result.extracted_fields && Object.keys(result.extracted_fields).length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Extracted Fields</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            {Object.entries(result.extracted_fields).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-gray-500 capitalize">{k.replace(/_/g, ' ')}</dt>
                <dd className="text-sm font-medium text-gray-800">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
        <span className="text-xs text-gray-500">Routed to queue:</span>
        <span className="text-sm font-mono font-semibold text-indigo-700">{result.routed_to}</span>
      </div>

      {result.extracted_text && (
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            Extracted text preview
          </summary>
          <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32 text-gray-600">
            {result.extracted_text}
          </pre>
        </details>
      )}
    </div>
  )
}

export default function App() {
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInput = useRef(null)

  const processFile = useCallback(async (file) => {
    setResult(null)
    setError(null)

    setStep('Extracting')
    await new Promise(r => setTimeout(r, 800))
    setStep('Classifying')

    const form = new FormData()
    form.append('file', file)

    try {
      const fetchPromise = fetch(`${API}/upload`, { method: 'POST', body: form })
      await new Promise(r => setTimeout(r, 900))
      setStep('Routing')
      await new Promise(r => setTimeout(r, 500))
      setStep('Complete')

      const resp = await fetchPromise
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.detail || `HTTP ${resp.status}`)
      }
      const data = await resp.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
      setStep(null)
    }
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const onFileChange = useCallback((e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
    e.target.value = ''
  }, [processFile])

  const busy = step !== null && step !== 'Complete'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">DocFlow</h1>
          <p className="mt-1 text-gray-500 text-sm">
            Automated document intake · Classification · Routing
          </p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !busy && fileInput.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
            ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
            ${busy ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
            className="hidden"
            onChange={onFileChange}
            disabled={busy}
          />
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-700 font-medium">
            {dragging ? 'Drop it!' : 'Drop a PDF or image here'}
          </p>
          <p className="text-gray-400 text-sm mt-1">or click to browse</p>
          <p className="text-gray-300 text-xs mt-3">PDF · PNG · JPEG · TIFF · BMP</p>
        </div>

        {step && <StepIndicator currentStep={step} />}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {result && step === 'Complete' && <ResultCard result={result} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the build still passes**

```bash
cd dashboard && npm run build
```

Expected: dist/ rebuilt with no errors.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/App.jsx
git commit -m "feat: add DocFlow React dashboard with drag-drop upload and results card"
```

---

## Task 3: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint (flake8)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Cache pip
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
          restore-keys: ${{ runner.os }}-pip-
      - run: pip install flake8
      - run: flake8 api/ pipeline/ router/ --max-line-length=100

  test:
    name: Test (pytest)
    runs-on: ubuntu-latest
    env:
      ANTHROPIC_API_KEY: test_key
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Cache pip
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}
          restore-keys: ${{ runner.os }}-pip-
      - run: pip install -r requirements.txt
      - run: pytest tests/ --cov=api --cov=pipeline --cov=router --cov-report=term-missing

  build-check:
    name: Build check (Node)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: dashboard/package-lock.json
      - run: npm ci
        working-directory: dashboard
      - run: npm run build
        working-directory: dashboard
```

- [ ] **Step 2: Commit**

```bash
mkdir -p .github/workflows
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions pipeline — lint, pytest, node build-check"
```

---

## Task 4: Sample PDFs

**Files:**
- Create: `sample_docs/create_samples.py`
- Create: `sample_docs/invoice_sample.pdf` (generated)
- Create: `sample_docs/loan_application_sample.pdf` (generated)

- [ ] **Step 1: Create `sample_docs/create_samples.py`**

```python
"""Run once to regenerate sample PDFs: python sample_docs/create_samples.py"""
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors


OUT = Path(__file__).parent


def _doc(filename: str):
    path = OUT / filename
    return SimpleDocTemplate(str(path), pagesize=letter,
                             leftMargin=inch, rightMargin=inch,
                             topMargin=inch, bottomMargin=inch)


def make_invoice():
    doc = _doc("invoice_sample.pdf")
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontSize=22, spaceAfter=4)
    normal = styles["Normal"]
    story = [
        Paragraph("INVOICE", h1),
        Spacer(1, 0.1 * inch),
        Paragraph("<b>Invoice Number:</b> INV-2024-0042", normal),
        Paragraph("<b>Date:</b> January 15, 2024", normal),
        Paragraph("<b>Due Date:</b> February 15, 2024", normal),
        Spacer(1, 0.2 * inch),
        Paragraph("<b>Bill From:</b>", normal),
        Paragraph("Acme Corporation", normal),
        Paragraph("742 Evergreen Terrace, Springfield, IL 62701", normal),
        Paragraph("billing@acmecorp.com  |  (312) 555-0100", normal),
        Spacer(1, 0.2 * inch),
        Paragraph("<b>Bill To:</b>", normal),
        Paragraph("Globex Industries Ltd.", normal),
        Paragraph("1200 Harbor Blvd, Weehawken, NJ 07086", normal),
        Spacer(1, 0.3 * inch),
    ]
    table_data = [
        ["Description", "Qty", "Unit Price", "Total"],
        ["Cloud Storage Services (Jan 2024)", "1", "$850.00", "$850.00"],
        ["API Calls — Premium Tier", "500,000", "$0.0006", "$300.00"],
        ["Support SLA — Business", "1", "$84.56", "$84.56"],
        ["", "", "Subtotal", "$1,234.56"],
        ["", "", "Tax (0%)", "$0.00"],
        ["", "", "Amount Due", "$1,234.56"],
    ]
    t = Table(table_data, colWidths=[3 * inch, 0.8 * inch, 1.2 * inch, 1.2 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -4), [colors.whitesmoke, colors.white]),
        ("FONTNAME", (2, -3), (-1, -1), "Helvetica-Bold"),
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.black),
        ("LINEABOVE", (2, -1), (-1, -1), 1.5, colors.HexColor("#1e3a5f")),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -4), 0.3, colors.lightgrey),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("Payment terms: Net 30. Please remit via ACH to routing 021000021, "
                            "account 4567890123.", normal))
    doc.build(story)
    print(f"Written: {OUT / 'invoice_sample.pdf'}")


def make_loan_application():
    doc = _doc("loan_application_sample.pdf")
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontSize=18, spaceAfter=4)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=13, spaceAfter=2)
    normal = styles["Normal"]
    story = [
        Paragraph("RESIDENTIAL MORTGAGE LOAN APPLICATION", h1),
        Paragraph("Uniform Residential Loan Application — Form 1003", normal),
        Spacer(1, 0.2 * inch),
        Paragraph("Section I — Borrower Information", h2),
        Paragraph("<b>Applicant Name:</b> James R. Thornton", normal),
        Paragraph("<b>Date of Birth:</b> March 4, 1981", normal),
        Paragraph("<b>SSN:</b> XXX-XX-4521", normal),
        Paragraph("<b>Phone:</b> (630) 555-0177", normal),
        Paragraph("<b>Email:</b> jthornton@email.com", normal),
        Spacer(1, 0.15 * inch),
        Paragraph("Section II — Loan Information", h2),
        Paragraph("<b>Loan Amount Requested:</b> $485,000", normal),
        Paragraph("<b>Loan Type:</b> Conventional 30-Year Fixed", normal),
        Paragraph("<b>Interest Rate (estimated):</b> 6.875%", normal),
        Paragraph("<b>Application Date:</b> January 15, 2024", normal),
        Spacer(1, 0.15 * inch),
        Paragraph("Section III — Property Information", h2),
        Paragraph("<b>Property Address:</b> 1452 Oakwood Drive, Naperville, IL 60540", normal),
        Paragraph("<b>Property Type:</b> Single Family Residence", normal),
        Paragraph("<b>Estimated Value:</b> $540,000", normal),
        Paragraph("<b>Purpose:</b> Purchase", normal),
        Spacer(1, 0.15 * inch),
        Paragraph("Section IV — Employment & Income", h2),
        Paragraph("<b>Employer:</b> Midwest Analytics Group, Inc.", normal),
        Paragraph("<b>Position:</b> Senior Data Engineer", normal),
        Paragraph("<b>Years Employed:</b> 7", normal),
        Paragraph("<b>Annual Gross Income:</b> $142,000", normal),
        Spacer(1, 0.15 * inch),
        Paragraph("Section V — Assets & Liabilities", h2),
        Paragraph("<b>Checking/Savings:</b> $68,400", normal),
        Paragraph("<b>Retirement (401k):</b> $214,000", normal),
        Paragraph("<b>Monthly Debt Obligations:</b> $1,240", normal),
        Spacer(1, 0.3 * inch),
        Paragraph("I certify that the information provided in this application is true and correct. "
                  "Signature: _________________________   Date: ___________", normal),
    ]
    doc.build(story)
    print(f"Written: {OUT / 'loan_application_sample.pdf'}")


if __name__ == "__main__":
    make_invoice()
    make_loan_application()
```

- [ ] **Step 2: Run the script to generate PDFs**

```bash
python sample_docs/create_samples.py
```

Expected output:
```
Written: .../sample_docs/invoice_sample.pdf
Written: .../sample_docs/loan_application_sample.pdf
```

- [ ] **Step 3: Commit**

```bash
git add sample_docs/
git commit -m "feat: add sample invoice and loan application PDFs via reportlab"
```

---

## Task 5: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# DocFlow

An automated document intake and classification pipeline that simulates **AWS Textract** and **AWS Bedrock Data Automation** for an Enterprise Content Management (ECM) system.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          DocFlow Pipeline                        │
│                                                                  │
│   Browser / API Client                                           │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐    POST /upload                                 │
│  │  FastAPI    │◄───────────────── PDF / Image                  │
│  │  (api/)     │                                                 │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐    Mock AWS Textract                            │
│  │  Extractor  │    pdfplumber (PDF) / pytesseract (images)      │
│  │ (pipeline/) │    → {raw_text, page_count, source, confidence} │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐    Mock AWS Bedrock (Anthropic claude-sonnet)   │
│  │ Classifier  │    → {document_type, confidence,                │
│  │ (pipeline/) │       extracted_fields, summary}                │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐    Route to typed output queue                  │
│  │   Router    │    output/{invoices,loan_applications,...}/      │
│  │  (router/)  │    + JSONL audit log per queue                  │
│  └─────────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| API server | FastAPI + Uvicorn |
| Text extraction | pdfplumber (PDF), pytesseract (images) |
| AI classification | Anthropic claude-sonnet (via `anthropic` SDK) |
| Document routing | Python pathlib, JSONL audit log |
| Frontend | React 18 + Vite + Tailwind CSS |
| Tests | pytest + pytest-cov |
| CI | GitHub Actions |

## Setup

### 1. Clone & install Python deps

```bash
git clone <repo-url>
cd docflow
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Generate sample documents (optional)

```bash
python sample_docs/create_samples.py
```

### 4. Start the FastAPI server

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at http://localhost:8000/docs

### 5. Start the React dashboard

```bash
cd dashboard
npm install
npm run dev
```

Dashboard available at http://localhost:5173

## Running Tests

```bash
pytest --cov=api --cov=pipeline --cov=router --cov-report=term-missing
```

## Document Types & Output Queues

| Document Type | Output Queue |
|---------------|-------------|
| invoice | `output/invoices/` |
| loan_application | `output/loan_applications/` |
| government_id | `output/government_ids/` |
| contract | `output/contracts/` |
| bank_statement | `output/bank_statements/` |
| unknown | `output/unknown/` |

Each queue has a `routing_log.jsonl` audit file with per-document records.

## Swapping Mock Clients for Real AWS in Production

### Replace MockTextractClient → boto3 Textract

In `pipeline/extractor.py`, replace `MockTextractClient` with:

```python
import boto3

class TextractClient:
    def __init__(self):
        self.client = boto3.client("textract", region_name="us-east-1")

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

### Replace MockBedrockClient → boto3 Bedrock Runtime

In `pipeline/classifier.py`, replace `MockBedrockClient` with:

```python
import boto3, json

class BedrockClient:
    def __init__(self):
        self.client = boto3.client("bedrock-runtime", region_name="us-east-1")

    def invoke_model(self, model_id: str, body: dict) -> dict:
        resp = self.client.invoke_model(
            modelId=model_id,
            body=json.dumps({"inputText": body.get("text", "")}),
            contentType="application/json",
            accept="application/json",
        )
        return json.loads(resp["body"].read())
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with architecture diagram, setup guide, and AWS swap instructions"
```

---

## Task 6: Verify & Final Smoke Test

- [ ] **Step 1: Run the full test suite**

```bash
pytest --cov=api --cov=pipeline --cov=router --cov-report=term-missing
```

Expected: all tests pass, coverage ≥ 80%.

- [ ] **Step 2: Run flake8 lint**

```bash
flake8 api/ pipeline/ router/ --max-line-length=100
```

Expected: no output (no lint errors).

- [ ] **Step 3: Verify dashboard builds clean**

```bash
cd dashboard && npm run build && echo "Build OK"
```

Expected: `Build OK`

- [ ] **Step 4: Final commit if anything was adjusted**

```bash
git add -p  # stage only intentional changes
git commit -m "chore: final polish and verification"
```
