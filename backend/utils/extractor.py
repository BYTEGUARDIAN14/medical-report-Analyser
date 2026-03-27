import io
from pathlib import Path
from typing import IO

import fitz
import pytesseract
from PIL import Image


SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".txt"}


def get_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def is_supported_file(filename: str) -> bool:
    return get_extension(filename) in SUPPORTED_EXTENSIONS


def extract_from_pdf(file_stream: IO[bytes]) -> str:
    file_bytes = file_stream.read()
    if not file_bytes:
        return ""

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_text = []
    try:
        for page in doc:
            pages_text.append(page.get_text("text"))
    finally:
        doc.close()

    return "\n".join(pages_text).strip()


def extract_from_image(file_stream: IO[bytes]) -> str:
    file_bytes = file_stream.read()
    if not file_bytes:
        return ""

    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image).strip()


def extract_from_text(file_stream: IO[bytes]) -> str:
    return file_stream.read().decode("utf-8", errors="ignore").strip()


def extract_text(file_stream: IO[bytes], filename: str) -> str:
    extension = get_extension(filename)
    file_stream.seek(0)

    if extension == ".pdf":
        return extract_from_pdf(file_stream)
    if extension in {".png", ".jpg", ".jpeg"}:
        return extract_from_image(file_stream)
    if extension == ".txt":
        return extract_from_text(file_stream)

    raise ValueError(f"Unsupported file type: {extension}")
