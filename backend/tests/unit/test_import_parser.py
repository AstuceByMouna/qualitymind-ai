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
