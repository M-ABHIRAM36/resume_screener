from io import BytesIO
from typing import Optional
import pdfplumber
import docx


def extract_text_from_bytes(data: bytes, filename: str) -> str:
    """Extract text from resume with improved parsing"""
    name = filename.lower() if filename else ''
    text = ''
    try:
        if name.endswith('.pdf'):
            try:
                with pdfplumber.open(BytesIO(data)) as pdf:
                    # Extract from all pages
                    pages_text = []
                    for page in pdf.pages:
                        # Try to extract text
                        page_text = page.extract_text()
                        if page_text:
                            pages_text.append(page_text)
                        
                        # Also try to extract from tables
                        tables = page.extract_tables()
                        if tables:
                            for table in tables:
                                table_text = ' '.join([' '.join([cell or '' for cell in row]) for row in table])
                                pages_text.append(table_text)
                    
                    text = "\n".join(pages_text)
                    
                    # Clean up text
                    text = ' '.join(text.split())  # Normalize whitespace
                    
            except Exception as e:
                print(f"PDF extraction error: {e}")
                text = ''
        elif name.endswith('.docx'):
            try:
                bio = BytesIO(data)
                d = docx.Document(bio)
                # Extract from paragraphs
                paragraphs = [p.text for p in d.paragraphs if p.text.strip()]
                
                # Also extract from tables
                for table in d.tables:
                    for row in table.rows:
                        row_text = ' '.join([cell.text for cell in row.cells if cell.text.strip()])
                        if row_text:
                            paragraphs.append(row_text)
                
                text = "\n".join(paragraphs)
                text = ' '.join(text.split())  # Normalize whitespace
                
            except Exception as e:
                print(f"DOCX extraction error: {e}")
                text = ''
        elif name.endswith('.doc'):
            # Try to read as text (old .doc format - limited support)
            try:
                text = data.decode('utf-8', errors='ignore')
            except Exception:
                text = ''
        else:
            try:
                text = data.decode('utf-8', errors='ignore')
            except Exception:
                text = ''
    except Exception as e:
        print(f"Text extraction error: {e}")
        text = ''
    
    return text
