"""Publish a compact Pytest JUnit XML summary in GitHub Actions.

Uses only the Python standard library. Missing reports are reported explicitly:
a setup failure may prevent Pytest from creating XML.
"""

import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def render_summary(report: Path, title: str) -> str:
    lines = [f"### {title}", ""]
    if not report.is_file():
        return "\n".join(
            [*lines, "⚠️ No JUnit XML report found. Check setup/test logs.", ""]
        )
    try:
        root = ET.parse(report).getroot()
    except ET.ParseError as exc:
        return "\n".join(
            [*lines, f"⚠️ Invalid JUnit XML: {exc}", ""]
        )

    cases = root.findall(".//testcase")
    total = len(cases)
    failed = sum(case.find("failure") is not None for case in cases)
    errors = sum(case.find("error") is not None for case in cases)
    skipped = sum(case.find("skipped") is not None for case in cases)
    passed = total - failed - errors - skipped

    lines.extend(
        [
            "| Passed | Failed | Errors | Skipped | Total |",
            "| ---: | ---: | ---: | ---: | ---: |",
            f"| {passed} | {failed} | {errors} | {skipped} | {total} |",
            "",
        ]
    )
    if total == 0:
        lines.extend(["⚠️ No test cases found in the JUnit XML.", ""])
    if failed + errors:
        lines.extend(["**Failed/error cases (up to 10):**", ""])
        for case in cases:
            if case.find("failure") is None and case.find("error") is None:
                continue
            name = (case.get("classname", "") + "." + case.get("name", "")).strip(".")
            # Markdown-safe inline code and no multiline content from test names.
            name = name.replace("`", "'").replace("\n", " ").replace("\r", " ")
            lines.append(f"- `{name}`")
            if sum(line.startswith("- `") for line in lines) >= 10:
                break
        lines.append("")
    lines.append(f"Source: `{report.as_posix()}` (download JUnit artifact for details).")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python scripts/junit_summary.py REPORT.xml TITLE")
    content = render_summary(Path(sys.argv[1]), sys.argv[2])
    output = os.environ.get("GITHUB_STEP_SUMMARY")
    if output:
        with Path(output).open("a", encoding="utf-8") as handle:
            handle.write(content + "\n")
    else:
        print(content)


if __name__ == "__main__":
    main()
