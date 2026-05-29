# DocFlow Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the DocFlow React dashboard with a dark/midnight aesthetic and extensive framer-motion animations across six scroll-driven sections: Hero, How It Works, Upload, Processing overlay, Results, and History.

**Architecture:** `App.jsx` becomes a thin orchestrator that holds upload/processing state and passes props to six focused components in `dashboard/src/components/`. A new `GET /history` FastAPI endpoint reads all `output/*/routing_log.jsonl` files and returns records sorted newest-first. framer-motion is used for scroll-triggered entrances, mount/unmount transitions, spring interactions, and parallax.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, framer-motion 12, FastAPI, pytest

---

## File Map

| File | Role |
|------|------|
| `api/main.py` | Add `GET /history` endpoint |
| `tests/test_api.py` | New — tests for `/history` endpoint |
| `dashboard/src/index.css` | Dark scrollbar + smooth scroll base |
| `dashboard/src/App.jsx` | Thin orchestrator — state + section layout |
| `dashboard/src/components/Hero.jsx` | Full-viewport hero with parallax + floating doc cards |
| `dashboard/src/components/HowItWorks.jsx` | 3-column pipeline explainer, scroll-triggered |
| `dashboard/src/components/UploadZone.jsx` | Animated drag-drop zone with spring interactions |
| `dashboard/src/components/Processing.jsx` | Full-screen overlay for upload in-progress |
| `dashboard/src/components/ResultCard.jsx` | Animated results card with confidence bar + field stagger |
| `dashboard/src/components/History.jsx` | History table fetched from `/history`, rows stagger in |

---

## Task 1: GET /history backend endpoint (TDD)

**Files:**
- Modify: `api/main.py`
- Create: `tests/test_api.py`

- [ ] **Step 1: Create `tests/test_api.py` with failing tests**

```python
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from api.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_history_empty_when_no_output_dir(client, tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    resp = client.get("/history")
    assert resp.status_code == 200
    assert resp.json() == []


def test_history_returns_log_entries(client, tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    log_dir = tmp_path / "output" / "invoices"
    log_dir.mkdir(parents=True)
    record = {
        "filename": "inv.pdf",
        "document_type": "invoice",
        "queue": "invoices",
        "destination": "output/invoices/20240101T000000Z_inv.pdf",
        "timestamp": "2024-01-01T00:00:00+00:00",
        "metadata": {},
    }
    (log_dir / "routing_log.jsonl").write_text(json.dumps(record) + "\n")
    resp = client.get("/history")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["filename"] == "inv.pdf"
    assert data[0]["document_type"] == "invoice"


def test_history_sorted_newest_first(client, tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    log_dir = tmp_path / "output" / "invoices"
    log_dir.mkdir(parents=True)
    older = {"filename": "a.pdf", "document_type": "invoice", "queue": "invoices",
             "destination": "x", "timestamp": "2024-01-01T00:00:00+00:00", "metadata": {}}
    newer = {"filename": "b.pdf", "document_type": "invoice", "queue": "invoices",
             "destination": "x", "timestamp": "2024-06-01T00:00:00+00:00", "metadata": {}}
    lines = json.dumps(older) + "\n" + json.dumps(newer) + "\n"
    (log_dir / "routing_log.jsonl").write_text(lines)
    resp = client.get("/history")
    data = resp.json()
    assert data[0]["filename"] == "b.pdf"
    assert data[1]["filename"] == "a.pdf"


def test_history_merges_multiple_queues(client, tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    for queue, doc_type in [("invoices", "invoice"), ("contracts", "contract")]:
        d = tmp_path / "output" / queue
        d.mkdir(parents=True)
        rec = {"filename": f"{queue}.pdf", "document_type": doc_type, "queue": queue,
               "destination": "x", "timestamp": "2024-01-01T00:00:00+00:00", "metadata": {}}
        (d / "routing_log.jsonl").write_text(json.dumps(rec) + "\n")
    resp = client.get("/history")
    assert len(resp.json()) == 2
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/rudraagarwal/docflow && source .venv/bin/activate && pytest tests/test_api.py -v
```

Expected: `FAILED` — `404 Not Found` for `/history`.

- [ ] **Step 3: Add `import json` and the `/history` endpoint to `api/main.py`**

At the top of `api/main.py`, add `import json` after the existing imports:

```python
import json
from contextlib import asynccontextmanager
from pathlib import Path
# ... rest of existing imports unchanged
```

After the existing `/health` endpoint, add:

```python
@app.get("/history")
async def get_history():
    records = []
    output_dir = Path("output")
    if output_dir.exists():
        for log_file in output_dir.glob("*/routing_log.jsonl"):
            for line in log_file.read_text().splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    records.sort(key=lambda r: r.get("timestamp", ""), reverse=True)
    return records
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_api.py -v
```

Expected: all 4 tests `PASSED`.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
pytest --cov=api --cov=pipeline --cov=router --cov-report=term-missing
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add api/main.py tests/test_api.py
git commit -m "feat: add GET /history endpoint that reads routing_log.jsonl files"
```

---

## Task 2: Dark base styles

**Files:**
- Modify: `dashboard/src/index.css`

- [ ] **Step 1: Replace `dashboard/src/index.css` with dark theme base**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

* {
  scrollbar-width: thin;
  scrollbar-color: #1e293b #0a0f1e;
}

*::-webkit-scrollbar {
  width: 6px;
}

*::-webkit-scrollbar-track {
  background: #0a0f1e;
}

*::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 3px;
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/index.css
git commit -m "style: dark scrollbar and smooth scroll base styles"
```

---

## Task 3: Hero component

**Files:**
- Create: `dashboard/src/components/Hero.jsx`

- [ ] **Step 1: Create `dashboard/src/components/` directory and `Hero.jsx`**

```bash
mkdir -p /Users/rudraagarwal/docflow/dashboard/src/components
```

```jsx
// dashboard/src/components/Hero.jsx
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const FLOATING_DOCS = [
  { label: 'Invoice_Q1.pdf', type: 'invoice', left: '72%', top: '22%', rotate: 12 },
  { label: 'Contract.pdf', type: 'contract', left: '15%', top: '30%', rotate: -8 },
  { label: 'LoanApp.pdf', type: 'loan', left: '68%', top: '68%', rotate: -14 },
  { label: 'Statement.pdf', type: 'bank', left: '18%', top: '65%', rotate: 7 },
]

const DOC_COLORS = {
  invoice: { bg: '#1e3a5f', text: '#60a5fa', border: '#3b82f640' },
  contract: { bg: '#2a1f4e', text: '#a78bfa', border: '#818cf840' },
  loan: { bg: '#2e1b5e', text: '#c4b5fd', border: '#7c3aed40' },
  bank: { bg: '#1a3a38', text: '#2dd4bf', border: '#14b8a640' },
}

export default function Hero({ onScrollToUpload }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0f1e]">
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,_#1e3a5f22_0%,_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_50%,_#3b82f608_0%,_transparent_60%)]" />

      {/* Floating document cards */}
      {FLOATING_DOCS.map((doc, i) => {
        const c = DOC_COLORS[doc.type]
        return (
          <motion.div
            key={doc.label}
            className="absolute hidden lg:block select-none"
            style={{ left: doc.left, top: doc.top, rotate: doc.rotate }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{
              opacity: [0, 0.6, 0.5, 0.6],
              y: [0, -12, 0, -8, 0],
              scale: [0.7, 1, 1],
            }}
            transition={{
              opacity: { duration: 0.8, delay: 0.6 + i * 0.2 },
              y: { duration: 5 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 },
              scale: { duration: 0.8, delay: 0.6 + i * 0.2 },
            }}
          >
            <div
              className="px-3 py-2 rounded-lg text-xs font-mono backdrop-blur-sm border flex items-center gap-2"
              style={{ background: c.bg, borderColor: c.border, color: c.text }}
            >
              <span>📄</span>
              <span>{doc.label}</span>
            </div>
          </motion.div>
        )
      })}

      {/* Main content with parallax */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        style={{ y, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-8 border border-blue-500/20 text-blue-400 bg-blue-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Intelligent Document Processing
          </span>
        </motion.div>

        <motion.h1
          className="text-7xl md:text-9xl font-black tracking-tight text-white mb-6 leading-none"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Doc
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #a78bfa 100%)' }}
          >
            Flow
          </span>
        </motion.h1>

        <motion.p
          className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          Automated intake, classification, and routing — powered by AI. Drop a document and watch the pipeline work.
        </motion.p>

        <motion.button
          onClick={onScrollToUpload}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-semibold text-base"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            boxShadow: '0 0 30px #3b82f640',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 50px #3b82f660' }}
          whileTap={{ scale: 0.97 }}
        >
          Try it now
          <motion.span
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            className="text-lg"
          >
            ↓
          </motion.span>
        </motion.button>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070c1a] to-transparent" />
    </section>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/rudraagarwal/docflow/dashboard && npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no errors.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/Hero.jsx
git commit -m "feat: add Hero section with parallax and floating doc cards"
```

---

## Task 4: HowItWorks component

**Files:**
- Create: `dashboard/src/components/HowItWorks.jsx`

- [ ] **Step 1: Create `dashboard/src/components/HowItWorks.jsx`**

```jsx
// dashboard/src/components/HowItWorks.jsx
import { motion } from 'framer-motion'

const STEPS = [
  {
    icon: '📤',
    title: 'Extract',
    desc: 'Text pulled from PDFs via pdfplumber and from images via Tesseract OCR — simulating AWS Textract.',
    color: '#3b82f6',
    glow: '#3b82f6',
    number: '01',
  },
  {
    icon: '🧠',
    title: 'Classify',
    desc: 'Claude Sonnet reads the extracted text, identifies the document type, pulls key fields, and scores confidence.',
    color: '#818cf8',
    glow: '#818cf8',
    number: '02',
  },
  {
    icon: '📬',
    title: 'Route',
    desc: 'Documents land in typed output queues with a full JSONL audit trail — ready for downstream processing.',
    color: '#10b981',
    glow: '#10b981',
    number: '03',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
}

const card = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

export default function HowItWorks() {
  return (
    <section className="py-32 px-6 bg-[#070c1a]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-4">Pipeline</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How it works</h2>
          <p className="text-gray-500 text-lg">Three stages. Fully automated.</p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.title}
              variants={card}
              className="relative rounded-2xl p-8 border border-white/5 bg-[#0a1020] flex flex-col overflow-hidden"
              whileHover={{ y: -6, borderColor: `${step.color}40`, boxShadow: `0 20px 60px ${step.glow}15` }}
              transition={{ duration: 0.25 }}
            >
              {/* Large background number */}
              <span
                className="absolute top-4 right-5 text-6xl font-black opacity-5 select-none"
                style={{ color: step.color }}
              >
                {step.number}
              </span>

              {/* Icon */}
              <motion.div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-6"
                style={{
                  background: `${step.color}15`,
                  boxShadow: `0 0 24px ${step.glow}25`,
                }}
                whileHover={{ scale: 1.1, rotate: -5 }}
              >
                {step.icon}
              </motion.div>

              <h3 className="text-xl font-bold mb-3" style={{ color: step.color }}>
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>

              {/* Bottom accent line */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${step.color}40, transparent)` }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/rudraagarwal/docflow/dashboard && npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no errors.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/HowItWorks.jsx
git commit -m "feat: add HowItWorks section with staggered card entrance"
```

---

## Task 5: UploadZone component

**Files:**
- Create: `dashboard/src/components/UploadZone.jsx`

- [ ] **Step 1: Create `dashboard/src/components/UploadZone.jsx`**

```jsx
// dashboard/src/components/UploadZone.jsx
import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useCallback, useState } from 'react'

export default function UploadZone({ onFile, busy, uploadRef }) {
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef(null)

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  const onFileChange = useCallback(
    (e) => {
      const file = e.target.files[0]
      if (file) onFile(file)
      e.target.value = ''
    },
    [onFile],
  )

  return (
    <section ref={uploadRef} className="py-32 px-6 bg-[#0a0f1e]">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-purple-500 mb-4">Upload</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Process a document</h2>
          <p className="text-gray-500 text-lg">Drop any PDF or image — the pipeline handles the rest.</p>
        </motion.div>

        <motion.div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !busy && fileInput.current?.click()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          animate={
            dragging
              ? { scale: 1.02, borderColor: '#3b82f6' }
              : busy
                ? {}
                : { scale: 1 }
          }
          className={`relative rounded-3xl p-20 text-center transition-colors border-2 border-dashed
            ${dragging ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.025]'}
            ${busy ? 'cursor-not-allowed opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          style={dragging ? { boxShadow: '0 0 60px #3b82f620, inset 0 0 60px #3b82f608' } : {}}
        >
          {/* Animated corner brackets */}
          {[
            'top-4 left-4 border-t-2 border-l-2',
            'top-4 right-4 border-t-2 border-r-2',
            'bottom-4 left-4 border-b-2 border-l-2',
            'bottom-4 right-4 border-b-2 border-r-2',
          ].map((cls) => (
            <motion.div
              key={cls}
              className={`absolute w-5 h-5 ${cls}`}
              animate={{
                borderColor: dragging ? '#3b82f6' : '#ffffff20',
                scale: dragging ? 1.3 : 1,
              }}
              transition={{ duration: 0.2 }}
            />
          ))}

          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
            className="hidden"
            onChange={onFileChange}
            disabled={busy}
          />

          {/* Icon */}
          <motion.div
            className="text-6xl mb-5 select-none"
            animate={
              dragging
                ? { scale: 1.4, rotate: -8, y: -4 }
                : { scale: 1, rotate: 0, y: 0 }
            }
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            📄
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.p
              key={dragging ? 'drop' : 'idle'}
              className="text-white font-semibold text-xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {dragging ? 'Release to process' : 'Drop a PDF or image here'}
            </motion.p>
          </AnimatePresence>

          <p className="text-gray-600 text-sm mt-2">or click to browse</p>
          <p className="text-gray-700 text-xs mt-4 tracking-wide">
            PDF · PNG · JPEG · TIFF · BMP
          </p>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/rudraagarwal/docflow/dashboard && npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no errors.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/UploadZone.jsx
git commit -m "feat: add animated UploadZone with spring drag interactions"
```

---

## Task 6: Processing overlay component

**Files:**
- Create: `dashboard/src/components/Processing.jsx`

- [ ] **Step 1: Create `dashboard/src/components/Processing.jsx`**

```jsx
// dashboard/src/components/Processing.jsx
import { motion, AnimatePresence } from 'framer-motion'

const PIPELINE_STEPS = ['Extracting', 'Classifying', 'Routing']

const STEP_META = {
  Extracting: { icon: '📤', desc: 'Reading document text…', color: '#3b82f6' },
  Classifying: { icon: '🧠', desc: 'Identifying document type…', color: '#818cf8' },
  Routing: { icon: '📬', desc: 'Sending to output queue…', color: '#a78bfa' },
}

export default function Processing({ currentStep }) {
  const active = currentStep && currentStep !== 'Complete'
  const meta = STEP_META[currentStep] || {}
  const stepIdx = PIPELINE_STEPS.indexOf(currentStep)

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
          style={{ background: 'rgba(7, 12, 26, 0.96)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Glow orb behind icon */}
          <motion.div
            className="absolute w-64 h-64 rounded-full"
            style={{ background: `radial-gradient(circle, ${meta.color}20 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          />

          {/* Current step display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              className="relative text-center mb-16"
              initial={{ opacity: 0, y: 30, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.85 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="text-8xl mb-6 select-none"
                animate={{ rotate: [0, -6, 6, -3, 3, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                {meta.icon}
              </motion.div>
              <h2 className="text-4xl font-black text-white mb-3">{currentStep}</h2>
              <p className="text-gray-500 text-lg">{meta.desc}</p>
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="flex items-center gap-4">
            {PIPELINE_STEPS.map((step, i) => {
              const done = i < stepIdx
              const isActive = i === stepIdx
              const c = STEP_META[step].color
              return (
                <div key={step} className="flex items-center gap-4">
                  <motion.div
                    className="relative flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold text-white"
                    animate={{
                      backgroundColor: done ? '#10b981' : isActive ? c : '#1e293b',
                      boxShadow: isActive ? `0 0 24px ${c}80, 0 0 48px ${c}40` : 'none',
                      scale: isActive ? 1.15 : 1,
                    }}
                    transition={{ duration: 0.35 }}
                  >
                    {done ? '✓' : i + 1}
                  </motion.div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <motion.div
                      className="h-px w-10"
                      animate={{ backgroundColor: done ? '#10b981' : '#1e293b' }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/rudraagarwal/docflow/dashboard && npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no errors.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/Processing.jsx
git commit -m "feat: add Processing overlay with animated step transitions"
```

---

## Task 7: ResultCard component

**Files:**
- Create: `dashboard/src/components/ResultCard.jsx`

- [ ] **Step 1: Create `dashboard/src/components/ResultCard.jsx`**

```jsx
// dashboard/src/components/ResultCard.jsx
import { motion } from 'framer-motion'

const TYPE_STYLES = {
  invoice: { bg: '#1a2f4e', text: '#60a5fa', border: '#3b82f630' },
  loan_application: { bg: '#251a4a', text: '#a78bfa', border: '#818cf830' },
  government_id: { bg: '#162e25', text: '#34d399', border: '#10b98130' },
  contract: { bg: '#2e2410', text: '#fbbf24', border: '#f59e0b30' },
  bank_statement: { bg: '#122e2c', text: '#2dd4bf', border: '#14b8a630' },
  unknown: { bg: '#1a2030', text: '#94a3b8', border: '#47556930' },
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-gray-500">Confidence</span>
        <motion.span
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {pct}%
        </motion.span>
      </div>
      <div className="w-full rounded-full h-1.5 bg-[#0f1829]">
        <motion.div
          className="h-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}60` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
        />
      </div>
    </div>
  )
}

export default function ResultCard({ result }) {
  const styles = TYPE_STYLES[result.document_type] || TYPE_STYLES.unknown
  const label = result.document_type.replace(/_/g, ' ')
  const fields = result.extracted_fields ? Object.entries(result.extracted_fields) : []

  return (
    <motion.section
      className="py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          className="rounded-2xl border p-8"
          style={{
            background: '#0c1628',
            borderColor: styles.border,
            boxShadow: `0 24px 80px ${styles.text}10`,
          }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6 gap-4">
            <h2 className="text-white font-semibold text-lg truncate">{result.filename}</h2>
            <motion.span
              className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold capitalize border"
              style={{ background: styles.bg, color: styles.text, borderColor: styles.border }}
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, delay: 0.25 }}
            >
              {label}
            </motion.span>
          </div>

          <ConfidenceBar value={result.confidence} />

          {/* Summary */}
          {result.summary && (
            <motion.p
              className="mt-5 text-sm text-gray-400 italic pl-3 border-l-2 border-white/10"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
            >
              {result.summary}
            </motion.p>
          )}

          {/* Extracted fields */}
          {fields.length > 0 && (
            <div className="mt-6">
              <motion.p
                className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Extracted Fields
              </motion.p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                {fields.map(([k, v], i) => (
                  <motion.div
                    key={k}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.07, duration: 0.35 }}
                  >
                    <dt className="text-xs text-gray-600 capitalize mb-0.5">
                      {k.replace(/_/g, ' ')}
                    </dt>
                    <dd className="text-sm font-medium text-white">{String(v)}</dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          )}

          {/* Routing badge */}
          <motion.div
            className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
          >
            <span className="text-xs text-gray-600">Routed to</span>
            <span className="text-sm font-mono font-bold" style={{ color: styles.text }}>
              {result.routed_to}
            </span>
          </motion.div>

          {/* Raw text toggle */}
          {result.extracted_text && (
            <motion.details
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors select-none">
                Extracted text preview
              </summary>
              <pre className="mt-2 text-xs bg-[#070c1a] p-3 rounded-lg overflow-auto max-h-32 text-gray-500 whitespace-pre-wrap">
                {result.extracted_text}
              </pre>
            </motion.details>
          )}
        </motion.div>
      </div>
    </motion.section>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/rudraagarwal/docflow/dashboard && npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no errors.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/ResultCard.jsx
git commit -m "feat: add ResultCard with spring badge, confidence bar, and staggered fields"
```

---

## Task 8: History component

**Files:**
- Create: `dashboard/src/components/History.jsx`

- [ ] **Step 1: Create `dashboard/src/components/History.jsx`**

```jsx
// dashboard/src/components/History.jsx
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const API = 'http://localhost:8000'

const TYPE_COLORS = {
  invoice: '#60a5fa',
  loan_application: '#a78bfa',
  government_id: '#34d399',
  contract: '#fbbf24',
  bank_statement: '#2dd4bf',
  unknown: '#94a3b8',
}

export default function History({ refreshKey }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`${API}/history`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => setRecords(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [refreshKey])

  return (
    <section className="py-32 px-6 bg-[#070c1a]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-emerald-500 mb-4">Audit log</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Processing history</h2>
          <p className="text-gray-500 text-lg">Every document that passed through the pipeline.</p>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-20">
            <motion.div
              className="w-8 h-8 rounded-full border-2 border-t-blue-500 border-white/10"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            />
          </div>
        )}

        {!loading && error && (
          <motion.p
            className="text-center text-red-400/60 py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Could not load history — is the backend running?
          </motion.p>
        )}

        {!loading && !error && records.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-600">No documents processed yet.</p>
            <p className="text-gray-700 text-sm mt-1">Drop one above to get started.</p>
          </motion.div>
        )}

        {!loading && !error && records.length > 0 && (
          <motion.div
            className="rounded-2xl overflow-hidden border border-white/5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Table header */}
            <div className="grid grid-cols-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 bg-[#0a0f1e] border-b border-white/5">
              <span>File</span>
              <span>Type</span>
              <span>Queue</span>
              <span className="text-right">Timestamp</span>
            </div>

            {/* Rows */}
            {records.map((rec, i) => (
              <motion.div
                key={`${rec.timestamp}-${rec.filename}`}
                className="grid grid-cols-4 px-6 py-4 items-center border-b border-white/5 last:border-0 bg-[#0c1220] hover:bg-[#0f172a] transition-colors"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
              >
                <span className="text-sm text-white truncate pr-4 font-medium">
                  {rec.filename}
                </span>
                <span
                  className="text-xs font-medium capitalize"
                  style={{ color: TYPE_COLORS[rec.document_type] || '#94a3b8' }}
                >
                  {rec.document_type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-mono text-gray-500">{rec.queue}</span>
                <span className="text-xs text-gray-600 text-right tabular-nums">
                  {new Date(rec.timestamp).toLocaleString()}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/rudraagarwal/docflow/dashboard && npm run build 2>&1 | tail -5
```

Expected: `✓ built in` — no errors.

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/components/History.jsx
git commit -m "feat: add History section with staggered row animations from /history endpoint"
```

---

## Task 9: Wire up App.jsx + footer + final build

**Files:**
- Modify: `dashboard/src/App.jsx`

- [ ] **Step 1: Replace `dashboard/src/App.jsx` entirely**

```jsx
// dashboard/src/App.jsx
import { useCallback, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import UploadZone from './components/UploadZone'
import Processing from './components/Processing'
import ResultCard from './components/ResultCard'
import History from './components/History'

const API = 'http://localhost:8000'

export default function App() {
  const [step, setStep] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [historyKey, setHistoryKey] = useState(0)
  const uploadRef = useRef(null)

  const scrollToUpload = useCallback(() => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const processFile = useCallback(async (file) => {
    setResult(null)
    setError(null)
    setStep('Extracting')

    const form = new FormData()
    form.append('file', file)
    const fetchPromise = fetch(`${API}/upload`, { method: 'POST', body: form })

    await new Promise((r) => setTimeout(r, 800))
    setStep('Classifying')
    await new Promise((r) => setTimeout(r, 900))
    setStep('Routing')
    await new Promise((r) => setTimeout(r, 500))
    setStep('Complete')

    try {
      const resp = await fetchPromise
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }))
        throw new Error(err.detail || `HTTP ${resp.status}`)
      }
      const data = await resp.json()
      setResult(data)
      setHistoryKey((k) => k + 1)
    } catch (e) {
      setError(e.message)
      setStep(null)
    }
  }, [])

  const busy = step !== null && step !== 'Complete'

  return (
    <div className="bg-[#0a0f1e] min-h-screen">
      <Hero onScrollToUpload={scrollToUpload} />
      <HowItWorks />
      <UploadZone onFile={processFile} busy={busy} uploadRef={uploadRef} />

      <Processing currentStep={step} />

      <AnimatePresence>
        {error && (
          <div className="max-w-3xl mx-auto px-6">
            <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 text-red-400 text-sm">
              <span className="font-semibold">Error: </span>{error}
            </div>
          </div>
        )}
        {result && step === 'Complete' && (
          <ResultCard key={`${result.filename}-${result.timestamp}`} result={result} />
        )}
      </AnimatePresence>

      <History refreshKey={historyKey} />

      {/* Footer */}
      <footer className="py-10 text-center text-gray-700 text-xs border-t border-white/5 bg-[#070c1a]">
        DocFlow — Automated document intake &middot; Classification &middot; Routing
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Run full build**

```bash
cd /Users/rudraagarwal/docflow/dashboard && npm run build
```

Expected: `✓ built in` with no errors.

- [ ] **Step 3: Run full Python test suite**

```bash
cd /Users/rudraagarwal/docflow && source .venv/bin/activate && pytest --cov=api --cov=pipeline --cov=router --cov-report=term-missing
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/App.jsx
git commit -m "feat: wire up animated multi-section App with Hero, pipeline, upload, results, and history"
```