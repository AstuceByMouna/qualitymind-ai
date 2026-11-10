"""Temporary negative control for verifying QA-66 branch protection; never merge."""

def test_required_status_check_rejects_failure():
    assert False, "QA-66 intentional failure: ensure required CI blocks merge"
