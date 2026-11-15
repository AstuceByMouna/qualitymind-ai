# QA-84 — Plan de validation : modifier une exigence

**Jira :** https://gharbiconsulting.atlassian.net/browse/QA-84  
**Exigence :** FR-004 / QA-13  
**Branche :** `feature/QA-84-edit-requirement`  
**PR :** https://github.com/AstuceByMouna/qualitymind-ai/pull/31

## Contrat

- `PATCH /api/v1/requirements/{requirement_id}`
- Corps JSON : `title` et/ou `description` ; au moins une propriété obligatoire.
- Chaînes uniquement ; trim avant contrôle de longueur (1–255, 1–10000).
- `null`, champs inconnus, valeurs vides, caractère NUL ou UUID invalide : HTTP 422 (backend).
- ID inexistant : HTTP 404. Succès : HTTP 200 + RequirementRead.
- Identifiant et `created_at` inchangés, propriété non fournie conservée.
- Le proxy Next.js retourne HTTP 400 pour validation locale invalide, et conserve la saisie côté UI en cas d'erreur.

## Traçabilité de recette

| Cas | Attendu | Automatisation | Preuve |
| --- | --- | --- | --- |
| QA84-TC01 | Modifier une exigence, enregistrer, vérifier ID + date inchangés et persistance PostgreSQL | Pytest integration `test_requirement_patch.py` ; Playwright `@real-api` | CI pytest ; **Playwright QA NOT RUN** |
| QA84-TC02 | Annuler sans écriture ; réouverture avec valeurs initiales | Playwright QA | **NOT RUN** |
| QA84-TC03 | Validation champ vide, focus, 422 backend et aucune écriture | Pytest API + Playwright QA | Pytest CI ; **Playwright QA NOT RUN** |
| QA84-TC04 | UUID inexistant 404 ; UUID invalide 422 | Pytest API + Playwright QA | Pytest CI ; **Playwright QA NOT RUN** |
| QA84-TC05 | API indisponible : saisie conservée, retry possible, aucune double soumission | Playwright QA avec réponse simulée | **NOT RUN** |

**Note :** les tests Playwright @qa-only sont délibérément **SKIP** sans environnement TEST/QA sur `127.0.0.1:3001` et, selon le test, `QA84_FIXTURE_UUID`. Les tests simulés ne prouvent pas de persistance réelle.

## Vérifications automatiques

- Backend CI : `pytest tests/unit`, `pytest tests/api`, `pytest tests/integration` avec PostgreSQL isolé `qualitymind_test` dans GitHub Actions.
- Frontend CI : ESLint, Next.js production build.
- Postman API CI : régression du contrat existant.
- Tests E2E QA : démarrer `qualitymind_qa`, API sur `8001`, frontend sur `3001`; sélectionner une exigence **dédiée aux tests et non utilisée par une personne**, puis définir `QA84_FIXTURE_UUID=<uuid>` avant `npm run test:e2e:qa`.
- Le scénario `QA84-TC01` modifie l'exigence dédiée, puis restaure les deux champs via PATCH dans un bloc `finally`. Ne pas lancer ce scénario sur une donnée de production ou partagée.
- La base DEV `qualitymind` ne doit **jamais** recevoir de mutations E2E.

## Points à contrôler avant Ready for review / Merge

- [ ] CI Backend : PASS avec nouveau test d'intégration.
- [ ] CI Frontend lint/build : PASS.
- [ ] CI Postman : PASS.
- [ ] QA84-TC01 à TC05 : essais Playwright sur le poste QA, preuves et verdicts.
- [ ] Confirmer à nouveau l'isolation DEV/QA et la restauration de la fixture.
- [ ] Vérifier l'absence de secrets et les autorisations applicatives (MVP sans authentification native ; sécurité entreprise à développer).
- [ ] Revue du diff, validation des critères Jira et décision explicite de fusion.

## Principes

Une validation unit/API simulée ne vaut pas une validation de bout en bout réelle. Ne pas remplacer les verdicts NOT RUN par PASS sans preuve d'exécution. L'absence de mécanisme de suppression public doit être prise en compte pour gérer les données de recette.
