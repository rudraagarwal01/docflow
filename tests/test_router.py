import json
from pathlib import Path
import pytest
from router.workflow_router import route_document, ROUTE_MAP


def test_route_map_covers_all_types():
    expected = {
        "invoice", "loan_application", "government_id",
        "contract", "bank_statement", "unknown",
    }
    assert set(ROUTE_MAP.keys()) == expected


def test_route_invoice_goes_to_invoices_queue(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = route_document("inv.pdf", "invoice", b"pdf content", {"confidence": 0.97})
    assert result["queue"] == "invoices"
    assert Path(result["destination"]).exists()
    assert "timestamp" in result


def test_route_loan_application(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = route_document("loan.pdf", "loan_application", b"content", {})
    assert result["queue"] == "loan_applications"


def test_route_government_id(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = route_document("id.jpg", "government_id", b"content", {})
    assert result["queue"] == "government_ids"


def test_route_contract(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = route_document("contract.pdf", "contract", b"content", {})
    assert result["queue"] == "contracts"


def test_route_bank_statement(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = route_document("stmt.pdf", "bank_statement", b"content", {})
    assert result["queue"] == "bank_statements"


def test_unknown_type_routes_to_unknown(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = route_document("mystery.pdf", "some_bogus_type", b"content", {})
    assert result["queue"] == "unknown"


def test_routing_log_jsonl_written(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    route_document("c.pdf", "contract", b"data", {"confidence": 0.88})
    log = tmp_path / "output" / "contracts" / "routing_log.jsonl"
    assert log.exists()
    record = json.loads(log.read_text().splitlines()[0])
    assert record["document_type"] == "contract"
    assert record["queue"] == "contracts"
    assert "timestamp" in record
