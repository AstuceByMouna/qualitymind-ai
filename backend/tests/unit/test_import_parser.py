import io
import pytest
from openpyxl import Workbook
from app.modules.requirements.application.import_parser import parse, InvalidImport

def test_csv_preview_parsing_and_column_mapping():
    rows=parse(b"key,summary,details,priority,acceptance_criteria\nREQ-1,Login,Allow sign in,High,User can sign in\n","req.csv",
        {"external_id":"key","title":"summary","description":"details"})
    assert len(rows)==1
    assert rows[0]["external_id"]=="REQ-1"
    assert rows[0]["title"]=="Login"
    assert rows[0]["acceptance_criteria"]=="User can sign in"
    assert rows[0]["error"] is None

def test_xlsx_preview_parsing():
    wb=Workbook()
    ws=wb.active
    ws.append(["external_id","title","description"])
    ws.append(["REQ-1","Login","Allow sign in"])
    buf=io.BytesIO();wb.save(buf)
    rows=parse(buf.getvalue(),"requirements.xlsx")
    assert rows[0]["title"]=="Login"

@pytest.mark.parametrize("content,name",[
    (b"x","x.txt"),
    (b"foo,bar\n1,2\n","x.csv"),
    (b"external_id,title,description\n1,,text\n","x.csv"),
    (b"external_id,title,description\n1,a,b\n1,c,d\n","x.csv"),
    (b"\xff\xff","x.csv"),
    (b"","x.csv")
])
def test_invalid_files_are_rejected_or_marked(content,name):
    try:
        rows=parse(content,name)
    except InvalidImport:
        return
    assert any(row["error"] for row in rows)


def _xlsx_without_dimension(*rows):
    """Generate a valid streaming XLSX with no worksheet dimension metadata."""
    import re
    from zipfile import ZipFile, ZIP_DEFLATED

    wb = Workbook()
    for row in rows:
        wb.active.append(list(row))
    source = io.BytesIO()
    wb.save(source)
    output = io.BytesIO()
    with ZipFile(io.BytesIO(source.getvalue()), "r") as original:
        with ZipFile(output, "w", compression=ZIP_DEFLATED) as rebuilt:
            for info in original.infolist():
                data = original.read(info.filename)
                if info.filename == "xl/worksheets/sheet1.xml":
                    data = re.sub(rb"<dimension\\b[^>]*/>", b"", data, count=1)
                rebuilt.writestr(info, data)
    return output.getvalue()


def test_xlsx_without_dimension_header_is_importable():
    content = _xlsx_without_dimension(
        ("external_id", "title", "description", "priority", "acceptance_criteria"),
        ("QA-105-1", "Valid XLSX", "Acceptance sample", "High", "Given A when B then C"),
    )
    rows = parse(content, "qa105-no-dimension.xlsx")
    assert len(rows) == 1
    assert rows[0]["external_id"] == "QA-105-1"
    assert rows[0]["acceptance_criteria"] == "Given A when B then C"
    assert rows[0]["error"] is None


def test_xlsx_without_dimension_rejects_101_columns():
    headings = ["external_id", "title", "description"] + [
        "extra_" + str(i) for i in range(98)
    ]
    content = _xlsx_without_dimension(
        headings,
        ["QA-105-2", "Too many columns", "Description"] + [""] * 98,
    )
    with pytest.raises(InvalidImport, match="too many columns"):
        parse(content, "too-wide-no-dimension.xlsx")


def test_xlsx_with_dimension_rejects_101_columns():
    wb = Workbook()
    wb.active.append(["external_id", "title", "description"] + ["v"] * 98)
    wb.active.append(["QA-105", "Title", "Description"] + ["v"] * 98)
    buf = io.BytesIO()
    wb.save(buf)
    with pytest.raises(InvalidImport, match="too many columns"):
        parse(buf.getvalue(), "too-wide.xlsx")
