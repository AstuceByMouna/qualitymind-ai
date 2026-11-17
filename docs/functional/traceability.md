# Matrice de traçabilité fonctionnelle — Sprint 5

**Date :** 16 novembre 2026. **Règle :** « intégré et CI verte » n'est pas « recette humaine PASS ». Les sources Jira restent les statuts officiels des tickets. Les 36 FR constituent la **plateforme cible** ; la première release MVP-1 est limitée à Requirements Intelligence. Références : [Catalogue cible/MVP-1](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/262145), [Sprint 5 et UAT](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/1998867), [Registre de risques](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/2195469).

| Fonction / FR | Jira | Code/API principal | Preuve automatisée | Recette |
| --- | --- | --- | --- | --- |
| Création FR-001 / UUID FR-003 | QA-49, QA-82 | `requirements.py`, UI create | `backend/tests/api/test_requirements.py`, `frontend/tests/e2e/requirements-create.spec.ts` | À confirmer manuellement |
| Consultation/modification FR-004 | QA-53/54/84/85/101 | `requirement-edit-form.tsx`, `getRequirement()`, `requirements.py` | `frontend/tests/e2e/requirements-edit.spec.ts`, `requirement-edit-freshness.spec.ts` | QA-101 reste en revue |
| Critères FR-005 | QA-94, QA-101 | `acceptance_criteria.py`, `acceptance-criteria-editor.tsx` | `backend/tests/integration/test_acceptance_criteria.py`, `frontend/tests/e2e/acceptance-criteria.spec.ts` | À confirmer |
| Lifecycle FR-007 | QA-95 | `lifecycle.py`, `requirement-lifecycle.tsx` | `backend/tests/integration/test_requirement_lifecycle.py`, `frontend/tests/e2e/requirement-lifecycle.spec.ts` | À confirmer |
| Import FR-002 | QA-87, QA-98/99/100 | `imports.py`, `requirement-import.tsx` | `backend/tests/integration/test_import_requirements.py`, `frontend/tests/e2e/requirements-import.spec.ts` | À confirmer |
| Archive (extension) | QA-97 | `requirement.py`, archive/restore endpoints | `frontend/tests/e2e/requirement-archive.spec.ts` | À confirmer |
| Détection FR-006 | QA-96 | `quality_rules.py`, `quality_analysis.py` | `backend/tests/unit/test_quality_rules.py`, `frontend/tests/e2e/requirement-quality-analysis.spec.ts` | À confirmer |
| Revue IA AI-001/002/003/005/006 | QA-90 | `ai_analysis.py`, `openai_analyzer.py`, `ai-requirement-review.tsx` | `backend/tests/unit/test_ai_contract.py`, `backend/tests/integration/test_ai_analysis_review.py`, `frontend/tests/e2e/requirement-ai-review.spec.ts` | **Appel OpenAI réel non validé** |
| NFR-003 : gestion des clés | QA-90 | Variable serveur `OPENAI_API_KEY`, `store=false` | mocks / validation de configuration | Revue sécurité réelle restant à faire |
| NFR-007/008 : persistance et échecs | QA-49/90/94 | PostgreSQL + transactions/contrats | Tests d'intégration | À confirmer |

## Anomalies signalées pendant UAT

| Bug | Situation | Preuve attendue |
| --- | --- | --- |
| [QA-98](https://gharbiconsulting.atlassian.net/browse/QA-98) | Correctif fusionné PR #41 | Nom fichier complet et zone accessible |
| [QA-99](https://gharbiconsulting.atlassian.net/browse/QA-99) | Correctif fusionné PR #41 | Toutes données importées dans preview |
| [QA-100](https://gharbiconsulting.atlassian.net/browse/QA-100) | Correctif fusionné PR #41 | Navigation fiche si 1, résumé si N |
| [QA-101](https://gharbiconsulting.atlassian.net/browse/QA-101) | Correctif fusionné PR #42 | Données de détail à jour sur Edit |

## Écarts de spécification à arbitrer avant stabilisation

1. **Transitions d'états :** le mapping `ALLOWED_FROM` de `lifecycle.py` indique, pour chaque **état cible**, les **états sources autorisés** ; il est cohérent avec l'UI et l'ADR-002 : `Draft → In Review`, `In Review → Ready`, `In Review → Draft`, `Ready → Draft`. Les transitions non prévues sont rejetées en HTTP 409.
2. **Documentation ancienne :** `README.md`, `system-architecture.md` et quelques plans QA reflètent encore la baseline du 9 novembre et qualifient l'UI/IA de futures. Le dossier fonctionnel à jour prévaut pour l'**état implémenté**, en attendant une révision séparée des pages historiques.
3. **Versionnement de l'exigence :** pas d'audit des anciennes valeurs de titre/description ; BR-008 partiel.
4. **Module complet AI Test Design :** QA-90 propose des scénarios textuels mais ne crée pas d'entité TestCase du catalogue FR-008–014.
5. **Gestion de risques et gouvernance :** la colonne `priority` et le `risk_level` des suggestions IA ne remplacent pas le Risk-Based Testing formel ni les Quality Gates métier.
6. **OpenAI :** tests CI sous mock, pas encore de preuve E2E payante sur un échantillon fictif approuvé.

## Méthode de validation finale

Exécuter les scripts QA isolés : `scripts/qa_env.py db-up`, `migrate`, `api`, `frontend`, `check`, puis `cd frontend && npm run test:e2e:qa`. Les scripts d'intégration Pytest utilisent **uniquement** `qualitymind_test`, jamais `qualitymind_qa` ni `qualitymind`. Publier les preuves GitHub Actions/Playwright, noter toute anomalie sous ticket Jira et faire valider la recette manuelle avant transition en Terminé.
