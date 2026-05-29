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
