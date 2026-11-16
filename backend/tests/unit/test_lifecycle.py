from app.modules.requirements.application.lifecycle import ALLOWED_FROM

def test_transition_policy_is_complete():
    assert set(ALLOWED_FROM) == {"Draft", "In Review", "Ready"}
    assert ALLOWED_FROM["In Review"] == frozenset({"Draft"})
    assert ALLOWED_FROM["Ready"] == frozenset({"In Review"})
    assert ALLOWED_FROM["Draft"] == frozenset({"In Review", "Ready"})
    for target, origins in ALLOWED_FROM.items():
        assert target not in origins
