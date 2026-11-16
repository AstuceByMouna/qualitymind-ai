"""Parse bounded CSV/XLSX and classify rows; never writes user requirements."""
import csv
import io
from zipfile import BadZipFile
from openpyxl import load_workbook
from pathlib import Path

MAX_FILE_BYTES = 2 * 1024 * 1024
MAX_ROWS = 500
FIELDS = ("external_id","title","description","priority","acceptance_criteria")
ALIASES = {"id":"external_id","requirement_id":"external_id","name":"title","details":"description"}

class InvalidImport(ValueError):
    pass

def parse(content: bytes, filename: str, mapping: dict[str,str] | None = None) -> list[dict]:
    if not content or len(content)>MAX_FILE_BYTES:
        raise InvalidImport("File is empty or exceeds 2 MiB")
    extension=Path(filename).suffix.lower()
    if extension not in (".csv",".xlsx"):
        raise InvalidImport("Only CSV and XLSX formats are allowed")
    if extension==".csv":
        try:
            raw=content.decode("utf-8-sig")
            rows=list(csv.reader(io.StringIO(raw, newline=""), strict=True))
        except (UnicodeError,csv.Error) as exc:
            raise InvalidImport("CSV must be valid UTF-8") from exc
    else:
        try:
            wb=load_workbook(io.BytesIO(content),read_only=True,data_only=True)
            if len(wb.worksheets)!=1:
                raise InvalidImport("XLSX must contain exactly one worksheet")
            if wb.active.max_column > 100:
                raise InvalidImport("XLSX contains too many columns")
            rows=list(wb.active.iter_rows(max_row=MAX_ROWS+2,max_col=100,values_only=True))
            wb.close()
        except (ValueError, OSError, KeyError, TypeError, IndexError, BadZipFile) as exc:
            raise InvalidImport("Invalid XLSX spreadsheet") from exc
    if len(rows)<2 or len(rows)>MAX_ROWS+1:
        raise InvalidImport("File must contain 1 to 500 data rows")
    header=[str(v or "").strip().lower() for v in rows[0]]
    if len(header)!=len(set(header)) or not all(header):
        raise InvalidImport("Duplicate or empty header")
    mapping=mapping or {}
    if any(key not in FIELDS or value not in header for key,value in mapping.items()):
        raise InvalidImport("Invalid column mapping")
    indices={}
    for field in FIELDS:
        aliases=[field]+[a for a,b in ALIASES.items() if b==field]
        candidates=[mapping[field]] if field in mapping else aliases
        match=next((header.index(c) for c in candidates if c in header),None)
        if match is not None: indices[field]=match
    if not {"external_id","title","description"}.issubset(indices):
        raise InvalidImport("Columns external_id, title and description are required")
    parsed=[]
    seen=set()
    for number,values in enumerate(rows[1:],start=2):
        def field(name):
            index=indices.get(name)
            return str(values[index] if index is not None and index<len(values) and values[index] is not None else "").strip()
        item={k:field(k) for k in FIELDS}
        item["row"]=number
        error=None
        if not item["external_id"] or len(item["external_id"])>255:
            error="Invalid external_id (1–255 characters)"
        elif not item["title"] or len(item["title"])>255:
            error="Invalid title (1–255 characters)"
        elif not item["description"] or len(item["description"])>10000:
            error="Invalid description (1–10,000 characters)"
        elif any("\x00" in str(v) for v in item.values()):
            error="NUL characters are not allowed"
        elif item["external_id"] in seen:
            error="Duplicate external ID within file"
        if item["priority"] and len(item["priority"])>32:
            error="Priority exceeds 32 characters"
        if item["acceptance_criteria"] and len(item["acceptance_criteria"])>2000:
            error="Acceptance criterion exceeds 2,000 characters"
        seen.add(item["external_id"])
        item["error"]=error
        parsed.append(item)
    return parsed
