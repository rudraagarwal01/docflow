import json
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from pipeline.classifier import classify_document
from pipeline.extractor import extract_text
from router.workflow_router import route_document

load_dotenv()

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/tiff",
    "image/bmp",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path("output").mkdir(exist_ok=True)
    yield


app = FastAPI(title="DocFlow", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "DocFlow"}


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


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{file.content_type}'. "
                "Accepted: PDF, PNG, JPEG, TIFF, BMP."
            ),
        )

    file_bytes = await file.read()
    filename = file.filename or "document.pdf"

    extraction = extract_text(file_bytes, filename)
    classification = classify_document(extraction["raw_text"])
    routing = route_document(
        filename=filename,
        document_type=classification["document_type"],
        file_bytes=file_bytes,
        metadata={**extraction, **classification},
    )

    return {
        "filename": filename,
        "extracted_text": extraction["raw_text"][:500],
        "document_type": classification["document_type"],
        "confidence": classification["confidence"],
        "extracted_fields": classification.get("extracted_fields", {}),
        "summary": classification.get("summary", ""),
        "routed_to": routing["queue"],
        "destination": routing["destination"],
        "timestamp": routing["timestamp"],
    }
