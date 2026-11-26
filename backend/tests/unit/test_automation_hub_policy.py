"""QA-112: path references must not permit filesystem or network traversal."""
import pytest

from app.modules.automation_hub.policy import validate_playwright_path


@pytest.mark.parametrize("path", [
    "frontend/tests/e2e/login.spec.ts",
    "tests/checkout.test.ts",
    "tests/auth-flow.spec.js",
])
def test_valid_playwright_reference(path):
    assert validate_playwright_path(path) == path


@pytest.mark.parametrize("path", [
    "../secrets.spec.ts", "tests/../secret.spec.ts",
    "/etc/secret.spec.ts", "C:/secret.spec.ts",
    "https://evil.example/x.spec.ts", "tests\\bad.spec.ts",
    "tests//bad.spec.ts", "./x.spec.ts", "",
    "tests/foo.py", "tests/invalid spec.ts",
    "tests/a.spec.ts?download=1", "tests/evil.spec.ts\nheader",
])
def test_invalid_playwright_reference(path):
    with pytest.raises(ValueError):
        validate_playwright_path(path)
