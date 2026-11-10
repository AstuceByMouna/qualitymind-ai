# QualityMind AI — Definition of Ready et Definition of Done

**Version :** 1.1 — état d'adoption mis à jour le 9 novembre 2026  
**Jira :** [QA-22](https://gharbiconsulting.atlassian.net/browse/QA-22)  
**Confluence :** [Gouvernance SDLC](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/458753) · [Stratégie QA](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/425986)

## Definition of Ready (DoR) — avant de commencer

- [ ] Ticket Jira, responsable et résultat attendu définis.
- [ ] Exigence(s), User Story et critères d'acceptation identifiés, si applicables.
- [ ] Risques, cas limites, dépendances et contraintes de sécurité connus.
- [ ] Stratégie de vérification et conditions de succès identifiées.
- [ ] Contraintes et décisions d'architecture nécessaires documentées.

Une tâche purement documentaire peut être évaluée sur ses propres livrables : ne pas inventer de test logiciel quand aucun logiciel n'a été changé.

## Definition of Done (DoD) — avant la clôture

- [ ] Le périmètre annoncé et les critères d'acceptation sont satisfaits.
- [ ] Les exigences et les risques sont liés aux preuves de validation, lorsque pertinents.
- [ ] Les changements sont sur une branche dédiée au ticket Jira.
- [ ] Les fichiers ont été revus, sans secrets ni modifications non souhaitées.
- [ ] Tests pertinents exécutés et résultats enregistrés ; si aucun test d'exécution n'est applicable, justification notée.
- [ ] Les contrôles CI **effectivement configurés** ont réussi ; les contrôles non déployés sont marqués `NOT_RUN` ou `NOT_APPLICABLE`, jamais `PASS`.
- [ ] Revue de Pull Request enregistrée et validation finale par le propriétaire.
- [ ] Pull Request fusionnée sur `main` et artefacts vérifiés sur `main`.
- [ ] Documents Confluence/GitHub synchronisés ; décisions importantes et limites documentées.
- [ ] Liens Jira ↔ exigences ↔ branche/commits ↔ PR ↔ tests/résultats ajoutés.
- [ ] Ticket Jira clôturé seulement après vérification des livrables.

## Règles Quality Gate

**PASS :** tous les contrôles applicables et obligatoires ont réussi.  
**FAIL :** au moins un contrôle bloquant a échoué.  
**BLOCKED :** preuve ou dépendance nécessaire indisponible.  
**NOT_RUN :** contrôle non exécuté, ne vaut pas réussite.  
**NOT_APPLICABLE :** contrôle justifié comme non pertinent pour le changement.

Les décisions automatisées sont déterministes. L'IA ne peut pas contourner un Gate ni approuver une release.

## Grille adaptée aux types de changements

| Type | Tests prioritaires | Preuves |
| --- | --- | --- |
| Documentation | Cohérence avec architecture, liens, rendu Mermaid/Markdown | Diff, revue et validation |
| FastAPI | Tests API et unitaires, validation des réponses et erreurs | Pytest, rapport et PR |
| Persistance | Tests d'intégration et migrations | Rapport et environnement |
| IA | Schémas, jeu de référence, gestion d'erreurs, revue humaine | Évaluations et décisions |
| UI | Parcours critiques Playwright et contrôles d'accès | Rapport E2E et traces |

## Contrôles vérifiés et limites au 9 novembre 2026

- **Actif :** GitHub Actions Backend CI (Python 3.14, PostgreSQL 17, Alembic, Pytest), sur chaque Pull Request vers `main`; le statut `FastAPI / Pytest / PostgreSQL` est obligatoire par [Ruleset 26914184](https://github.com/AstuceByMouna/qualitymind-ai/rules/26914184). La vérification négative volontaire (PR #16, non fusionnée) a échoué et le blocage a été contrôlé.
- **Actif, non bloquant :** Postman API CI, intégré à Postman Cloud, activé par `POSTMAN_CI_ENABLED=true`; secret `POSTMAN_API_KEY` et variable de collection `base_url`. Succès confirmé par le propriétaire, sans publication des journaux dans le présent document.
- **Preuves :** QA-60 à QA-64 (corrections API/DB/validation/tests), QA-66 (protection), QA-67 (Postman), QA-68 (documentation). En QA-64, 35 tests Pytest ont réussi localement.
- **Pas encore implémenté :** couverture mesurée avec seuil obligatoire, lint/security scans bloquants, frontend/Playwright E2E, production/CD. Ne jamais déclarer ces contrôles `PASS`.
- **Indépendance :** une revue humaine tierce n'est pas établie ; les vérifications du propriétaire et les retours d'IA restent distincts d'un audit indépendant.

## Utilisation pour QA-22

QA-22 est un ticket documentaire. Pour le clôturer : stratégie et DoD versionnées sur GitHub, liens Confluence, Pull Request revue/fusionnée, validation du contenu par le propriétaire et preuve sur `main`.
