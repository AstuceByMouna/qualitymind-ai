# ADR-001 — Architecture MVP : monolithe modulaire

- **Statut :** retenu, validation finale QA-26 en attente
- **Date :** 2026-11-06
- **Responsable :** propriétaire QualityMind AI
- **Jira :** [QA-26](https://gharbiconsulting.atlassian.net/browse/QA-26)
- **Confluence :** [Architecture MVP et registre des décisions](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/458771)
- **Portée :** MVP, application SaaS générique

## Contexte

QualityMind AI est une plateforme Enterprise AI Quality Engineering destinée à centraliser les exigences, proposer des cas de test par IA, prioriser selon les risques, intégrer les exécutions automatisées, analyser les échecs et calculer des Quality Gates. Le MVP est développé initialement comme projet individuel et doit être testable, explicable et évolutif.

## Options examinées

| Option | Avantages | Limites |
| --- | --- | --- |
| Monolithe modulaire | Déploiement simple, tests locaux faciles, transactions et observabilité initiales simplifiées | Nécessite des frontières strictes entre modules |
| Microservices dès le MVP | Déploiement et évolution indépendants | Réseau, cohérence distribuée, surveillance, CI/CD et coûts opérationnels supplémentaires |

## Décision

**Retenir un monolithe modulaire** : frontend Next.js/React, API Python/FastAPI, services par domaines, SQLAlchemy/Alembic et PostgreSQL. Intégration OpenAI via une abstraction `LLMProvider` et l'API Responses (Structured Outputs, schémas Pydantic), activée après validation par mock.

Six domaines métier :
1. `requirements` : exigences, critères d'acceptation, versionnement et ambiguïtés.
2. `test_design` : cas de test, brouillons générés, approbation/rejet humain.
3. `risks` : évaluations de risque et priorisation des tests.
4. `automation` : scripts, campagnes, exécutions et résultats Playwright/Pytest.
5. `failure_analysis` : analyse de logs, hypothèses IA et décision humaine.
6. `governance` : traçabilité, métriques, Quality Gates et recommandation Go/No-Go.

Les routes API ne portent pas la logique métier. Les domaines échangent via des interfaces/contrats de service et ne manipulent pas directement les tables privées d'un autre domaine.

## Contrats MVP de départ

| Endpoint | Comportement |
| --- | --- |
| `GET /health` | HTTP 200, `{"status":"ok"}` |
| `POST /api/v1/requirements` | HTTP 201, validation 422 |
| `GET /api/v1/requirements` | Liste paginée |
| `GET /api/v1/requirements/{id}` | Détail ou HTTP 404 |
| `POST /api/v1/requirements/{id}/test-case-proposals` | Propositions IA ; schéma final à définir |
| `POST /api/v1/test-cases/{id}/approve` | Validation humaine authentifiée |

## Modèle de données conceptuel

- `Requirement` : id UUID, code unique, titre, description, statut, dates.
- `AcceptanceCriterion` : exigence parente, texte.
- `TestCase` : exigence liée, titre, préconditions, étapes, attendu, origine, approbation.
- `RiskAssessment` : exigence, impact, probabilité, niveau.
- `AutomationScript` : cas de test, framework, référence de version.
- `TestRun` et `TestResult` : dates, état, lien cas de test, référence des logs.
- `FailureAnalysis` : résultat, hypothèse, décision humaine.
- `QualityGateEvaluation` : exécution, instantané des règles, verdict, date.

Les relations, contraintes, index et migrations seront spécifiés pendant l'implémentation.

## Décisions complémentaires

- **ADR-002 :** interface `LLMProvider`, mock initial puis OpenAI Responses API.
- **ADR-003 :** les propositions IA restent des brouillons ; approbation humaine obligatoire.
- **ADR-004 :** Quality Gates déterministes calculés à partir de données stockées et règles configurées.
- **ADR-005 :** PostgreSQL + SQLAlchemy + Alembic.
- **ADR-006 :** exécution Playwright/Pytest isolée du processus web ; worker/file Redis reportés jusqu'au besoin démontré.

Ces références sont enregistrées ici comme décisions associées ; elles pourront être séparées en fichiers ADR dédiés à mesure que l'architecture évoluera.

## Exigences transversales et sécurité

- Les secrets et clés API ne doivent jamais être versionnés ni journalisés.
- Authentification, RBAC et contrôle d'accès par objet avant ouverture multiutilisateur.
- Entrées utilisateur, exigences et logs traités comme contenus non fiables, y compris contre les injections de prompt.
- Validation Pydantic et Structured Outputs, délais et tentatives limités, gestion explicite des erreurs fournisseur.
- Aucun texte produit par l'IA ne doit déclencher directement l'exécution de commandes.
- Tests unitaires des règles, tests API, tests d'intégration base, tests mock du provider et E2E Playwright lorsque l'UI sera disponible.
- Logs structurés et identifiants de corrélation, puis métriques/traces au fur et à mesure.

## Conséquences et trajectoire

Sprint 1 : FastAPI minimal, `GET /health`, Pytest, mise en place du dépôt et contrôles de qualité. Étapes suivantes : exigences/persistance, provider IA mocké puis réel, worker isolé, observabilité/CI. Extraire des services uniquement si des contraintes mesurées le justifient.

**Statut de validation :** architecture documentée dans Jira et Confluence ; la revue de la Pull Request documentaire et l'approbation finale du propriétaire conditionnent la clôture de QA-26. Ce document décrit une cible ; il ne prétend pas que les composants sont déjà implémentés.
