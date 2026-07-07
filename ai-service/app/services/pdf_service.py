from pypdf import PdfReader
from typing import List, Dict
from app.core.logging import logger


class PDFService:
    def extract_text_with_pages(self, file_path: str) -> List[Dict]:
        """Extract text from PDF, returning list of {page_num, text} dicts."""
        try:
            reader = PdfReader(file_path)
            pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                text = text.strip()
                if text:
                    pages.append({
                        "page_number": i + 1,
                        "text": text,
                    })
            logger.info(f"Extracted {len(pages)} pages from {file_path}")
            return pages
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            raise

    def get_page_count(self, file_path: str) -> int:
        reader = PdfReader(file_path)
        return len(reader.pages)


pdf_service = PDFService()
