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
    return SimpleDocTemplate(
        str(path),
        pagesize=letter,
        leftMargin=inch,
        rightMargin=inch,
        topMargin=inch,
        bottomMargin=inch,
    )


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
    t = Table(
        table_data,
        colWidths=[3 * inch, 0.8 * inch, 1.2 * inch, 1.2 * inch],
    )
    t.setStyle(
        TableStyle([
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
        ])
    )
    story.append(t)
    story.append(Spacer(1, 0.3 * inch))
    story.append(
        Paragraph(
            "Payment terms: Net 30. Please remit via ACH to routing 021000021, "
            "account 4567890123.",
            normal,
        )
    )
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
        Paragraph(
            "<b>Property Address:</b> 1452 Oakwood Drive, Naperville, IL 60540", normal
        ),
        Paragraph("<b>Property Type:</b> Single Family Residence", normal),
        Paragraph("<b>Estimated Value:</b> $540,000", normal),
        Paragraph("<b>Purpose:</b> Purchase", normal),
        Spacer(1, 0.15 * inch),
        Paragraph("Section IV — Employment &amp; Income", h2),
        Paragraph("<b>Employer:</b> Midwest Analytics Group, Inc.", normal),
        Paragraph("<b>Position:</b> Senior Data Engineer", normal),
        Paragraph("<b>Years Employed:</b> 7", normal),
        Paragraph("<b>Annual Gross Income:</b> $142,000", normal),
        Spacer(1, 0.15 * inch),
        Paragraph("Section V — Assets &amp; Liabilities", h2),
        Paragraph("<b>Checking/Savings:</b> $68,400", normal),
        Paragraph("<b>Retirement (401k):</b> $214,000", normal),
        Paragraph("<b>Monthly Debt Obligations:</b> $1,240", normal),
        Spacer(1, 0.3 * inch),
        Paragraph(
            "I certify that the information provided in this application is true and correct. "
            "Signature: _________________________   Date: ___________",
            normal,
        ),
    ]
    doc.build(story)
    print(f"Written: {OUT / 'loan_application_sample.pdf'}")


def make_bank_statement():
    doc = _doc("bank_statement_sample.pdf")
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontSize=20, spaceAfter=4)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=13, spaceAfter=2)
    normal = styles["Normal"]
    story = [
        Paragraph("FIRST NATIONAL BANK", h1),
        Paragraph("Account Statement — January 2024", normal),
        Spacer(1, 0.2 * inch),
        Paragraph("Account Holder: Sarah M. Erikson", normal),
        Paragraph("Account Number: ****7823", normal),
        Paragraph("Account Type: Personal Checking", normal),
        Paragraph("Statement Period: January 1 – January 31, 2024", normal),
        Spacer(1, 0.2 * inch),
        Paragraph("Summary", h2),
        Paragraph("<b>Opening Balance:</b> $4,212.88", normal),
        Paragraph("<b>Total Deposits:</b> $6,500.00", normal),
        Paragraph("<b>Total Withdrawals:</b> $3,847.32", normal),
        Paragraph("<b>Closing Balance:</b> $6,865.56", normal),
        Spacer(1, 0.2 * inch),
        Paragraph("Transaction History", h2),
    ]
    tx_data = [
        ["Date", "Description", "Debit", "Credit", "Balance"],
        ["01/03", "Direct Deposit — Payroll", "", "$3,250.00", "$7,462.88"],
        ["01/05", "RENT PAYMENT — LAKESIDE APTS", "$1,450.00", "", "$6,012.88"],
        ["01/08", "GROCERY STORE #214", "$127.43", "", "$5,885.45"],
        ["01/10", "NETFLIX SUBSCRIPTION", "$15.99", "", "$5,869.46"],
        ["01/12", "ELECTRIC UTILITY", "$98.22", "", "$5,771.24"],
        ["01/17", "Direct Deposit — Payroll", "", "$3,250.00", "$9,021.24"],
        ["01/20", "ATM WITHDRAWAL", "$200.00", "", "$8,821.24"],
        ["01/22", "ONLINE TRANSFER OUT", "$1,500.00", "", "$7,321.24"],
        ["01/28", "INTERNET PROVIDER", "$55.68", "", "$7,265.56"],
        ["01/31", "MONTHLY FEE WAIVED", "", "$0.00", "$6,865.56"],
    ]
    t = Table(tx_data, colWidths=[0.6 * inch, 2.8 * inch, 0.8 * inch, 0.8 * inch, 0.9 * inch])
    t.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c5f2e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
            ("PADDING", (0, 0), (-1, -1), 5),
        ])
    )
    story.append(t)
    story.append(Spacer(1, 0.3 * inch))
    story.append(
        Paragraph(
            "This statement is provided for informational purposes. "
            "Please report any discrepancies within 30 days to 1-800-555-0199.",
            normal,
        )
    )
    doc.build(story)
    print(f"Written: {OUT / 'bank_statement_sample.pdf'}")


if __name__ == "__main__":
    make_invoice()
    make_loan_application()
    make_bank_statement()
