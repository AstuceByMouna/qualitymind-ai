# QualityMind AI — Matrice de couverture et de traçabilité des tests

**Référence :** QA-55 (audit et stratégie) — US QA-69 (industrialisation des tests API/UI)
**Périmètre fonctionnel :** QA-53 (liste des exigences), QA-54 (détail des exigences), QA-49 (création et validation)
**Version :** 0.3 — revue documentaire corrigée, avant PR
**État :** à valider et à versionner dans `docs/qa/test-coverage-matrix.md`

## 1. Objectif

Établir une traçabilité vérifiable entre les User Stories, les comportements attendus, les risques, les tests automatisés et les preuves d'exécution.

Cette matrice distingue les scénarios exécutés avec succès, les exigences partiellement couvertes, les scénarios à automatiser et les anomalies signalées mais non encore reproduites localement.

Elle ne constitue pas une preuve de couverture à 100 % des exigences ou du code.

## 2. Références et périmètre

| Référence | Objet | État |
|---|---|---|
| QA-49 | Création et validation d'une exigence via API | Livré ; couverture à auditer |
| QA-53 | Liste, pagination et recherche dans la page courante | Frontend livré |
| QA-54 | Détail et erreurs 404 | Frontend livré |
| QA-55 | Audit de couverture et stratégie d'automatisation | En cours |
| QA-69 | Industrialiser les tests API et UI | US du Sprint 3 |

**Hors périmètre :** écran frontend de création et recherche globale côté serveur.

### Convention des statuts

| Statut | Définition |
|---|---|
| PASS | Scénario exécuté avec succès et preuve identifiée |
| PARTIEL | Exigence partiellement couverte |
| TODO | Test ou preuve restant à produire |
| FAIL | Test exécuté et échoué |
| BLOQUÉ | Exécution empêchée par une dépendance |
| N/A | Non applicable, avec justification |

Le statut d'un test et la couverture globale de son exigence sont différents.

## 3. Matrice de traçabilité

| ID | Story | Scénario | Risque | Niveau | Outil | Statut |
|---|---|---|---|---|---|---|
| TC-001 | QA-53 | Liste API : items, total, limit, offset | R-005 | API | Pytest | PASS |
| TC-002 | QA-53 | Ordre et pagination en base réelle | R-003, R-005 | Intégration | Pytest | PASS |
| TC-003 | QA-49 / QA-54 | Création, persistance et lecture | R-003 | Intégration | Pytest | PASS |
| TC-004 | QA-54 | UUID inexistant : HTTP 404 | R-005 | API | Pytest | PASS |
| TC-005 | QA-49 | Validation des données d'entrée | R-001 | Schéma / API | Pytest | PARTIEL |
| TC-006 | QA-53 | Afficher le registre dans le navigateur | R-007 | UI | Playwright | TODO |
| TC-007 | QA-53 | Naviguer entre les pages | R-003, R-007 | E2E | Playwright | TODO |
| TC-008 | QA-53 | Rechercher dans la page courante | R-002 | UI | Playwright | TODO |
| TC-009 | QA-54 | Ouvrir le détail depuis la liste | R-007 | E2E | Playwright | TODO |
| TC-010 | QA-54 | Afficher les deux variantes 404 | R-007 | UI | Playwright | TODO |
| TC-011 | QA-53 / QA-54 | Gérer une API indisponible | R-004 | Intégration UI | Playwright | TODO |
| TC-012 | Technique | Vérifier `/health` | R-005 | Smoke API | Pytest | PASS |
| TC-013 | Technique | Vérifier les règles CORS | R-005 | API | Pytest | PASS |
| TC-014 | Technique | Vérifier le contrat OpenAPI | R-005 | Contrat | Pytest | PASS |
| TC-015 | QA-53 / QA-54 | Vérifier la preuve d'exécution Postman CI | R-005, R-007 | Régression API | Postman CLI | TODO |

**TC-015 :** le workflow `.github/workflows/postman-ci.yml` existe. Le statut TODO signifie uniquement que le résultat d'exécution correspondant à cette baseline n'est pas encore rattaché à la matrice.

## 4. Traçabilité vers les tests existants

Les chemins suivants sont relatifs à `backend/`.

| TC | Fichier | Fonction Pytest | Preuve |
|---|---|---|---|
| TC-001 | `tests/test_requirements.py` | `test_list_page_shape_and_total` | Contrat mocké |
| TC-001 | `tests/test_requirements_api_coverage.py` | `test_list_defaults_and_empty_page` | Structure et liste |
| TC-001 | `tests/test_requirements_api_coverage.py` | `test_list_returns_empty_dataset` | Liste vide |
| TC-002 | `tests/test_requirements_api_coverage.py` | `test_list_order_and_pagination_with_isolated_test_records` | Pagination PostgreSQL |
| TC-003 | `tests/test_requirements_integration.py` | `test_create_and_retrieve_requirement` | Création et lecture |
| TC-003 | `tests/test_requirements_integration.py` | `test_database_connection` | Connexion PostgreSQL |
| TC-004 | `tests/test_requirements.py` | `test_get_requirement_not_found` | 404 avec mock |
| TC-004 | `tests/test_requirements_api_coverage.py` | `test_get_unknown_requirement_returns_404` | 404 avec base de test |
| TC-005 | `tests/test_requirement_validation.py` | `test_api_rejects_invalid_requirements` | 4 variantes HTTP 422 |
| TC-005 | `tests/test_requirement_validation.py` | `test_title_rejects_null_character` | Caractère NUL |
| TC-005 | `tests/test_requirement_validation.py` | `test_title_rejects_more_than_255_characters` | Longueur du titre |
| TC-005 | `tests/test_requirement_validation.py` | `test_description_rejects_excessive_length` | Longueur description |
| TC-005 | `tests/test_requirement_validation.py` | `test_title_length_checked_after_trimming` | Normalisation |
| TC-005 | `tests/test_requirement_validation.py` | `test_valid_requirement_is_accepted` | Données valides |
| TC-005 | `tests/test_requirement_validation.py` | `test_api_accepts_normalized_title_schema` | Titre normalisé |
| TC-005 | `tests/test_requirements.py` | `test_create_requirement_with_empty_title` | Titre vide |
| TC-005 | `tests/test_requirements.py` | `test_get_requirement_invalid_uuid` | UUID invalide |
| TC-005 | `tests/test_requirements.py` | `test_pagination_invalid_parameters` | Pagination invalide |
| TC-005 | `tests/test_requirements_api_coverage.py` | `test_get_invalid_uuid_returns_422` | 3 variantes |
| TC-005 | `tests/test_requirements_api_coverage.py` | `test_list_invalid_pagination_returns_422` | 6 variantes |
| TC-012 | `tests/test_health.py` | `test_health_returns_200` | Santé FastAPI |
| TC-013 | `tests/test_cors.py` | `test_cors_allows_frontend_origin` | Origine autorisée |
| TC-013 | `tests/test_cors.py` | `test_cors_rejects_unknown_origin` | Origine refusée |
| TC-014 | `tests/test_requirements.py` | `test_openapi_contract` | Contrat OpenAPI |

Les tests paramétrés produisent plusieurs cas exécutables à partir d'une même fonction.

Cette matrice n'est pas un inventaire de toutes les assertions.

## 5. Baseline d'exécution

**Environnement :** Windows, Git Bash, Python 3.14.6.

| Information | Valeur |
|---|---|
| Répertoire | `backend/` |
| Python | 3.14.6 |
| Pytest | 9.2.0 |
| Base de test | `qualitymind_test` |
| Variable POSTGRES_DB | `qualitymind_test` |
| Base utilisée par SQLAlchemy | `qualitymind_test` |
| Collecte | 35 tests, 0 erreur |
| Exécution | `python -m pytest -v` |
| Résultat | **35 passed, 1 warning** |
| Durée | 1,58 seconde |
| Échecs | 0 |
| Commit SHA | `32e50252556ec5b084e792af6330b5edb583dbed` |
| Version serveur PostgreSQL | `17.11` |
| Preuve GitHub Actions | À rattacher |
| Rapport local archivé | Non encore produit |

### Avertissement technique

`StarletteDeprecationWarning` : compatibilité future de `starlette.testclient` et `httpx`.

**Décision :** examiner les dépendances et leur compatibilité avant toute mise à jour.

### Couverture du code — Mesure locale confirmée

- Outil : pytest-cov
- Commande : python -m pytest --cov=app --cov-report=term-missing
- Environnement : Windows, Python 3.14.6
- Base de données : qualitymind_test
- Résultat : 35 passed, 1 warning
- Instructions mesurées : 148
- Instructions non couvertes : 5
- Couverture totale : 97 %

Modules à examiner :
- app/db.py : 84 % — configuration DATABASE_URL
  et absence de mot de passe.
- app/schemas/requirement.py : 96 % —
  validation des valeurs non textuelles.

Décision :
- Documenter les chemins non couverts.
- Évaluer leur criticité.
- Compléter les tests pertinents dans QA-73.
- Ne pas confondre couverture des instructions,
  couverture des branches et couverture métier.

## 6. Analyse des risques

### Méthode d'évaluation

Échelle proposée :

- Impact faible = 1 ; moyen = 2 ; élevé = 3.
- Probabilité faible = 1 ; moyenne = 2 ; élevée = 3.
- Score = impact × probabilité.

Interprétation :

- 1–2 : risque faible.
- 3–4 : risque moyen.
- 6–9 : risque élevé.

Les scores définitifs seront attribués après confirmation des probabilités.

| ID | Risque | Impact | Probabilité | Priorité provisoire |
|---|---|---|---|---|
| R-001 | Validation insuffisante des données invalides | Élevé | À évaluer | Élevée |
| R-002 | Recherche limitée à la page courante | Moyen | Élevée si incomprise | Moyenne à élevée |
| R-003 | Données E2E instables ou partagées | Élevé | Moyenne | Élevée |
| R-004 | Simulation incorrecte des pannes API côté serveur | Élevé | Moyenne | Élevée |
| R-005 | Confusion entre réussite et couverture | Élevé | Moyenne | Élevée |
| R-006 | Dépendances de test dépréciées | Moyen | À évaluer | À qualifier |
| R-007 | Régression frontend non détectée | Élevé | Élevée avant Playwright | Élevée |

### R-001 — Défauts potentiels de validation

La revue externe signale deux comportements à confirmer :

1. Un surrogate Unicode isolé (`\ud800`) provoquerait HTTP 500.
2. Des champs inconnus seraient acceptés dans une création d'exigence.

**Décision QA :**

- Reproduire le premier problème localement.
- Confirmer le contrat attendu pour les champs supplémentaires.
- Créer un Bug Jira uniquement après validation du comportement attendu et de la preuve.

### R-002 — Recherche locale

La recherche actuelle filtre les exigences chargées sur la page courante.

La pagination charge cinq exigences par page.

**Conséquence :** une exigence située sur une autre page ne sera pas retrouvée par le filtre local.

Le scénario TC-008 doit vérifier cette limite.

Une recherche globale devra faire l'objet d'une évolution fonctionnelle distincte si elle est souhaitée.

### R-003 — Données de test

Les tests de pagination nécessitent au minimum six exigences.

**Mesures prévues :**

- Utiliser `qualitymind_test`.
- Créer des données identifiables et reproductibles.
- Nettoyer uniquement les enregistrements créés par les tests.
- Garantir l'indépendance des scénarios.
- Éviter la base de développement et toute base de production.

### R-004 — Appels API côté serveur

Next.js récupère les données depuis le serveur.

`page.route()` de Playwright n'intercepte pas les appels HTTP effectués directement par le serveur Next.js.

**Décision :** utiliser un environnement de test dans lequel le serveur Next.js dispose d'un `API_BASE_URL` contrôlé, éventuellement injoignable pour les scénarios de panne.

### R-005 — Couverture

Les trois indicateurs doivent rester distincts :

1. Taux de réussite des tests.
2. Couverture du code.
3. Couverture des exigences et critères d'acceptation.

### R-006 — Dépendances

Suivre les avertissements de dépréciation, vérifier les versions et prévoir une mise à jour contrôlée avec tests de non-régression.

### R-007 — Parcours UI

La réussite des tests API ne démontre pas que le frontend est correct.

Les tests Playwright devront couvrir les parcours utilisateur prioritaires.

## 7. Stratégie d'automatisation

| Outil | Responsabilité |
|---|---|
| Pytest / HTTPX | Contrat API, validations et intégration PostgreSQL |
| Postman / CLI | Collections de régression et vérifications HTTP |
| Playwright / TypeScript | Parcours UI et E2E dans le navigateur |
| GitHub Actions | Exécution automatisée et preuves CI |

### Ordre recommandé pour Playwright

1. TC-006 : smoke test du registre.
2. TC-009 : navigation vers le détail.
3. TC-011 : comportement si l'API est indisponible.
4. TC-010 : deux variantes de la page 404.
5. TC-007 : pagination.
6. TC-008 : recherche dans la page courante.

Cet ordre peut évoluer selon les dépendances techniques.

### Bonnes pratiques

- Utiliser des sélecteurs accessibles (`getByRole`, `getByLabel`).
- Privilégier les assertions *web-first*.
- Éviter `waitForTimeout`.
- Utiliser des fixtures et des données déterministes.
- Séparer les tests UI des tests de contrat API.
- Conserver les traces utiles en cas d'échec.
- Éviter de stocker des secrets dans les rapports.
- Documenter les tests instables avant d'augmenter les retries.

## 8. Plan de validation QA-55

### Réalisé

- [x] Identifier les six fichiers de tests.
- [x] Collecter les 35 tests Pytest.
- [x] Vérifier `qualitymind_test`.
- [x] Exécuter les 35 tests avec succès.
- [x] Réaliser une revue indépendante.
- [x] Identifier les principaux scénarios API et UI.
- [x] Établir une matrice initiale.
- [x] Documenter les risques techniques.

### À réaliser

- [ ] Vérifier les critères d'acceptation exacts dans Jira.
- [ ] Renseigner le SHA du commit.
- [ ] Vérifier la version PostgreSQL.
- [ ] Rattacher la preuve Postman CI.
- [ ] Reproduire ou écarter les observations Unicode.
- [ ] Mesurer la couverture de code localement.
- [ ] Confirmer les scores de risque.
- [ ] Créer `docs/qa/automation-test-strategy.md`.
- [ ] Effectuer la revue documentaire finale.
- [ ] Créer et valider la Pull Request.

## 9. Évolution : contrôler automatiquement la traçabilité

Une fois les identifiants TC stabilisés, prévoir un contrôle CI qui vérifie :

- Qu'un scénario marqué PASS référence un test existant.
- Qu'un identifiant TC utilisé dans les tests figure dans la matrice.
- Que les références cassées sont détectées.
- Que les preuves d'exécution sont correctement liées aux versions du code.

Ce contrôle de cohérence documentaire ne remplace pas l'exécution des tests.

## 10. Critères de clôture QA-55

QA-55 pourra être clôturé lorsque :

1. La stratégie d'automatisation sera documentée.
2. La matrice aura été revue et approuvée.
3. Les risques et limitations seront identifiés.
4. Les preuves de la baseline seront rattachées.
5. Les anomalies confirmées auront un ticket Jira.
6. Les deux documents seront versionnés dans GitHub.
7. La Pull Request aura été revue et fusionnée.

**Les tests Playwright et leur industrialisation restent dans les autres sous-tâches de QA-69 et ne constituent pas un prérequis pour clôturer QA-55.**
