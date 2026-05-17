import json
import logging
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

ROUTE_MAP = {
    "invoice": "invoices",
    "loan_application": "loan_applications",
    "government_id": "government_ids",
    "contract": "contracts",
    "bank_statement": "bank_statements",
    "unknown": "unknown",
}

OUTPUT_BASE = Path("output")


def route_document(
    filename: str,
    document_type: str,
    file_bytes: bytes,
    metadata: dict,
) -> dict:
    queue = ROUTE_MAP.get(document_type, "unknown")
    dest_dir = OUTPUT_BASE / queue
    dest_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now(timezone.utc)
    ts = now.strftime("%Y%m%dT%H%M%SZ")
    dest_path = dest_dir / f"{ts}_{filename}"
    dest_path.write_bytes(file_bytes)

    record = {
        "filename": filename,
        "document_type": document_type,
        "queue": queue,
        "destination": str(dest_path),
        "timestamp": now.isoformat(),
        "metadata": metadata,
    }

    with open(dest_dir / "routing_log.jsonl", "a") as fh:
        fh.write(json.dumps(record) + "\n")

    logger.info("Routed '%s' → queue='%s'", filename, queue)
    return {"queue": queue, "destination": str(dest_path), "timestamp": record["timestamp"]}
