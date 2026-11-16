# QA-94 — FR-005 Acceptance Criteria / Plan de recette

Jira : https://gharbiconsulting.atlassian.net/browse/QA-94  
Sprint 5 · Epic QA-5 · Catalogue FR-005 / QA-10

## Périmètre
Ajouter, consulter, modifier et supprimer (après confirmation) plusieurs critères d'acceptation liés à une exigence. Le modèle est versionné par Alembic et respecte API → Service → Port → SQLAlchemy/PostgreSQL. Pas de génération IA dans cette US.

## Contrat API

- `GET /api/v1/requirements/{requirement_id}/acceptance-criteria`: HTTP 200, `{items: [...]}` ordonnés ; 404 exigence absente.
- `POST /api/v1/requirements/{requirement_id}/acceptance-criteria`: HTTP 201 avec `{content}`.
- `PATCH /api/v1/requirements/{requirement_id}/acceptance-criteria/{criterion_id}`: HTTP 200 avec `{content}`.
- `DELETE /api/v1/requirements/{requirement_id}/acceptance-criteria/{criterion_id}`: HTTP 204 sans body ; 404 si hors exigence ou absent.
- Critère : chaîne nettoyée de 1 à 2000 caractères, NUL interdit, pas de champs supplémentaires ; HTTP 422 si invalide ; UUID invalide HTTP 422.
- Enregistrements : `id, requirement_id, content, position, created_at`. Position attribuée à l'ajout, ordre stable et compacte lors de la suppression.
- UUID de l'exigence et champs titre/description/created_at jamais modifiés.

## Tests / risques

| Cas | Objectif | Preuve |
| --- | --- | --- |
| QA94-TC01 | Créer 2 critères et les retrouver après refresh | Playwright QA réel |
| QA94-TC02 | Éditer seulement le critère choisi, annuler un brouillon | Playwright + API |
| QA94-TC03 | Suppression confirmée et refusée, puis ordre conservé | Playwright + PostgreSQL isolé |
| QA94-TC04 | Absence d'exigence/critère, parent erroné, UUID invalide | Pytest API/integration |
| QA94-TC05 | Texte vide, blancs, NUL, >2000, champs inconnus | Pytest unit/API |
| QA94-TC06 | Régressions création, modification et recherche | CI existante |

Automatisation QA : fixture `QA84_FIXTURE_UUID` dans `qualitymind_qa` sur 5433, API 8001, frontend 3001. Les critères créés par le scénario sont nettoyés via leur UUID dans un bloc finally, et la fixture d'exigence est ensuite nettoyée par le workflow CI. **Ne jamais utiliser de données DEV ni d'exigences métier réelles.**

## Quality Gates
- [ ] Backend unit/API/PostgreSQL CI + Alembic upgrade/downgrade/upgrade
- [ ] Frontend lint/build
- [ ] Postman API régression
- [ ] QA-84/QA-91/QA-93 E2E + QA94-TC01
- [ ] QA-85 E2E
- [ ] Recette manuelle QA et validation de la PR

Ne pas annoncer PASS avant exécution ni fusionner automatiquement.
