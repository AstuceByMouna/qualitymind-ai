"""QA-96 explainable, deterministic testability hints (never a QA approval)."""
from dataclasses import asdict, dataclass
import re

RULESET_VERSION = "qa96-rules-v1"
VAGUE_TERMS = ("rapide", "rapidement", "facile", "facilement", "performant", "intuitif", "convivial", "robuste", "fast", "quickly", "easy", "user-friendly", "efficient", "seamless")
ACTORS = ("utilisateur", "utilisatrice", "client", "cliente", "administrateur", "administratrice", "système", "system", "user", "customer", "admin", "operator", "buyer", "guest", "visiteur", "agent")
CONDITIONS = ("si ", "lorsque ", "quand ", "étant donné", "given ", "when ", "if ", "after ", "upon ")
OUTCOMES = ("affiche", "afficher", "présente", "retourne", "renvoie", "enregistre", "enregistrer", "envoie", "notifie", "doit", "permet", "fournit", "displays", "shows", "returns", "saves", "sends", "notifies", "shall", "must", "provides", "allows", "creates", "rejects")

@dataclass(frozen=True)
class Finding:
    rule_id: str
    category: str
    observation: str
    rationale: str
    suggestion: str
    evidence: str | None = None
    nature: str = "deterministic-heuristic"

    def to_dict(self) -> dict:
        return asdict(self)

def _contains_term(text: str, term: str) -> bool:
    return re.search(r"(?<!\w)" + re.escape(term) + r"(?!\w)", text, flags=re.IGNORECASE) is not None

def analyze_requirement(title: str, description: str, criteria: list[str]) -> list[dict]:
    """Generate review suggestions without modifying requirement source data."""
    findings: list[Finding] = []
    combined = f"{title} {description}".lower()
    for term in VAGUE_TERMS:
        if _contains_term(combined, term):
            findings.append(Finding(
                rule_id="VAGUE-TERM", category="ambiguity",
                observation=f"Potentially untestable wording: {term}",
                rationale="The wording lacks an objectively measurable acceptance threshold.",
                suggestion="Replace it with measurable behavior, a threshold and test conditions.",
                evidence=term,
            ))
    if not any(_contains_term(combined, actor) for actor in ACTORS):
        findings.append(Finding(
            rule_id="ACTOR-CHECK", category="completeness",
            observation="An explicit actor is not recognized.",
            rationale="The ruleset did not identify a known actor; another valid actor may exist.",
            suggestion="Identify who or what initiates the behavior, if applicable.",
        ))
    if not any(token in combined for token in CONDITIONS):
        findings.append(Finding(
            rule_id="CONDITION-CHECK", category="completeness",
            observation="An execution condition or trigger is not explicit.",
            rationale="Test setup and triggering events may be unclear.",
            suggestion="State when the behavior occurs (Given/When, Si/Lorsque).",
        ))
    if not any(_contains_term(combined, outcome) for outcome in OUTCOMES):
        findings.append(Finding(
            rule_id="OUTCOME-CHECK", category="testability",
            observation="An observable expected result is not recognized.",
            rationale="A tester may not know which visible result to assert.",
            suggestion="Specify an externally observable behavior and expected result.",
        ))
    if not criteria:
        findings.append(Finding(
            rule_id="AC-CHECK", category="acceptance-criteria",
            observation="No acceptance criteria are recorded.",
            rationale="Acceptance criteria may be needed for objective verification.",
            suggestion="Add testable acceptance criteria if applicable.",
        ))
    return [finding.to_dict() for finding in findings]
