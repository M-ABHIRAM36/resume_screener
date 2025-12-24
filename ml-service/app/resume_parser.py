from io import BytesIO
from typing import Optional
import pdfplumber
import docx


def extract_text_from_bytes(data: bytes, filename: str) -> str:
    name = filename.lower() if filename else ''
    text = ''
    try:
        if name.endswith('.pdf'):
            try:
                with pdfplumber.open(BytesIO(data)) as pdf:
                    pages = [p.extract_text() or '' for p in pdf.pages]
                    text = "".join(pages)
            except Exception:
                text = ''
        elif name.endswith('.docx'):
            try:
                bio = BytesIO(data)
                d = docx.Document(bio)
                text = "".join([p.text for p in d.paragraphs])
            except Exception:
                text = ''
        else:
            try:
                text = data.decode('utf-8', errors='ignore')
            except Exception:
                text = ''
    except Exception:
        text = ''
    return text
