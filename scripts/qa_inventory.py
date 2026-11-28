"""Report source declarations for the QualityMind QA inventory, without executing tests."""
import ast
from collections import Counter
import csv
from enum import Enum
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


class Mode(Enum):
    MOCK_API = "simulated API"
    REAL_API = "integration intent; inspect environment and run"
    HYBRID = "real API and interception"
    UI = "browser; API coverage unclassified"


def source(file):
    return file.read_text(encoding="utf-8-sig")


def py_tests():
    for layer in ("unit", "api", "integration"):
        for file in sorted((ROOT / "backend" / "tests" / layer).rglob("test_*.py")):
            for node in ast.walk(ast.parse(source(file))):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name.startswith("test_"):
                    marks = [ast.unparse(mark).split("(")[0] for mark in node.decorator_list]
                    yield (f"pytest {layer}", file, node.lineno, node.name, ", ".join(marks))


TEST = re.compile(r"(?m)^\s*test(?:\.(skip|fixme|only))?\(\s*(['\"`])(.+?)\2\s*,")


def browser_tests():
    for file in sorted((ROOT / "frontend/tests").rglob("*.spec.ts")):
        body = source(file)
        tests = list(TEST.finditer(body))
        setup = body[:tests[0].start()] if tests else ""
        for index, match in enumerate(tests):
            end = tests[index + 1].start() if index + 1 < len(tests) else len(body)
            segment = setup + body[match.start():end]
            marker, _, name = match.groups()
            real = "@real-api" in name or "@real-qa" in name or ".request." in segment or "await request." in segment
            mocked = "@mock-api" in name or ".route(" in segment
            mode = Mode.HYBRID if real and mocked else Mode.REAL_API if real else Mode.MOCK_API if mocked else Mode.UI
            flags = [mode.value]
            if marker or re.search(r"\btest\.(?:skip|fixme)\(", segment):
                flags.append("skip/fixme declaration present")
            yield ("playwright", file, body.count("\n", 0, match.start(3)) + 1, name, "; ".join(flags))


def postman_requests(items, file):
    for item in items:
        if "item" in item:
            yield from postman_requests(item["item"], file)
            continue
        request = item.get("request")
        if not isinstance(request, dict):
            continue
        assertions = sum("\n".join(event.get("script", {}).get("exec", [])).count("pm.test(")
                         for event in item.get("event", []) if event.get("listen") == "test")
        yield ("postman request", file, "", item["name"], f"{request['method']}; {assertions} pm.test calls")


def api_routes():
    prefix_pattern = re.compile(r'APIRouter\(\s*prefix\s*=\s*"([^"]+)"', re.S)
    route_pattern = re.compile(r'@router\.(get|post|patch|delete|put)\(\s*"([^"]*)"', re.S)
    for file in sorted((ROOT / "backend/app/api/v1").glob("*.py")):
        body = source(file)
        prefix = prefix_pattern.search(body)
        for match in route_pattern.finditer(body):
            method, path = match.groups()
            yield ("declared API route", file, body.count("\n", 0, match.start()) + 1,
                   method.upper() + " " + (prefix.group(1) if prefix else "") + path, "source declaration")


def main():
    rows = list(py_tests()) + list(browser_tests()) + list(api_routes())
    for file in sorted((ROOT / "postman").glob("*.postman_collection.json")):
        rows.extend(postman_requests(json.loads(source(file))["item"], file))
    main_file = ROOT / "backend/app/main.py"
    rows.append(("declared API route", main_file, source(main_file).splitlines().index('@app.get("/health")') + 1,
                 "GET /health", "application entry point"))
    for file in sorted((ROOT / ".github/workflows").glob("*.yml")):
        match = re.search(r"^name:\s*(.+)$", source(file), re.M)
        rows.append(("github workflow", file, 1, match.group(1) if match else file.stem, "configured workflow"))

    destination = Path(sys.argv[1]) if len(sys.argv) == 2 else None
    if destination is not None:
        with destination.open("w", encoding="utf-8", newline="") as output:
            writer = csv.writer(output, lineterminator="\n")
            writer.writerow(["kind", "path", "line", "declaration", "source_observation"])
            writer.writerows((kind, file.relative_to(ROOT).as_posix(), line, name, note)
                             for kind, file, line, name, note in rows)
    print(json.dumps(dict(Counter(row[0] for row in rows)), sort_keys=True))


if __name__ == "__main__":
    main()
