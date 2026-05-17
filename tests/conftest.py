import io
import pytest
from reportlab.pdfgen import canvas as rl_canvas


def make_pdf_bytes(text: str = "Test Document Content\nAmount: $1,234.56") -> bytes:
    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf)
    y = 750
    for line in text.splitlines():
        c.drawString(72, y, line)
        y -= 20
    c.save()
    return buf.getvalue()


@pytest.fixture
def sample_pdf_bytes():
    return make_pdf_bytes()


@pytest.fixture
def invoice_pdf_bytes():
    return make_pdf_bytes(
        "INVOICE\nVendor: Acme Corp\nAmount: $1,234.56\nDate: 2024-01-15\nInvoice Number: INV-001"
    )
