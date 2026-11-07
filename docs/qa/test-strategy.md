# QualityMind AI — Stratégie de tests (MVP)

**Version :** 1.0 — baseline proposée  
**Ticket :** [QA-22](https://gharbiconsulting.atlassian.net/browse/QA-22)  
**Confluence :** [Stratégie QA](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/425986) · [Processus SDLC](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/458753)  
**Référentiel des exigences :** [Catalogue MVP](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/262145)

## 1. Objectifs, périmètre et principes

Assurer la conformité, la traçabilité, la robustesse, la sécurité et la testabilité de QualityMind AI, plateforme d'ingénierie qualité assistée par IA pour des applications SaaS génériques. Évaluer les six domaines : `requirements`, `test_design`, `risks`, `automation`, `failure_analysis`, `governance`.

Trois principes : **risk-based testing**, **shift-left** et **evidence-based quality gates**. Un LLM propose ; l'approbation des cas de test, les règles des Quality Gates et la décision de livraison restent sous contrôle humain. Les verdicts déterministes reposent sur des données vérifiables.

Le SUT de référence pour les démonstrations est **RealWorld (Conduit)** ; les tests de la plateforme QualityMind AI elle-même constituent un périmètre distinct.

## 2. Approche basée sur les risques

Pour chaque exigence, consigner impact et probabilité (échelle qualitative faible/moyen/élevé), contrôles existants, risque résiduel, priorité et couverture. Criticité accrue pour les mécanismes de décision, contrôles d'accès, gestion de secrets, génération IA, exécution de scripts et intégrité des données.

La matrice et les seuils numériques seront définis avant l'implémentation du module risques ; ne pas interpréter les priorités `Must` comme une preuve qu'une fonction est déjà livrée.

## 3. Niveaux et techniques de test

| Niveau | Cible / techniques | Outils prévus | Preuve attendue |
| --- | --- | --- | --- |
| Unitaires | Services, règles, validations, calculs de métriques et Gates ; valeurs frontières et erreurs | Pytest | Résultats et assertions reproductibles |
| API / contrat | HTTP, codes 200/201/404/422, schémas, erreurs, cas positifs/négatifs, accès | Pytest + HTTPX/TestClient | Rapport API et cas liés aux AC |
| Intégration | Repositories, PostgreSQL, migrations, services ; mocks IA | Pytest + PostgreSQL/Alembic | Persistance et contrats validés |
| UI / E2E | Parcours critiques utilisateur et droits, une fois le frontend présent | Playwright | Rapport et traces d'exécution |
| Robustesse IA | JSON Schema, Pydantic, réponses mal formées, timeouts, refus, injection de prompt, données de référence | Mocks et évaluations contrôlées | Résultats de validité, taux d'échec, revue humaine |
| Sécurité | Gestion des secrets, authentification, RBAC, accès par objet, entrées non fiables | Revues et contrôles automatisés disponibles | Preuves sans divulgation de secrets |
| Non fonctionnels | Latence, observabilité, récupération et capacité selon NFR et profils de charge approuvés | À choisir par incrément | Mesures datées, environnement et seuils documentés |

**Sprint 1 (QA-24) :** vérifier `GET /health` → HTTP 200 avec corps exact `{"status":"ok"}`, lancement local, exécution Pytest, erreurs de configuration de base. Ne pas prétendre tester PostgreSQL ou OpenAI avant leur intégration.

## 4. Traçabilité

`FR / NFR / AI / BR → US → critères d'acceptation → ticket d'implémentation → cas de test → script / exécution → résultat / défaut → Quality Gate`.

Exemple : `FR-001 → US-001 (QA-49) → AC-001..004 → futurs tests API/BDD`. Tout cas de test critique doit identifier sa source et sa version. Toute modification d'exigence nécessite une analyse d'impact sur les tests.

Jira suit tâches, statuts et défauts ; Confluence conserve exigences et décisions ; GitHub conserve code, cas automatisés, PR, commits et exécutions CI.

## 5. Politique de défauts et priorisation

- **Bloquant :** fuite de secret, contournement d'autorisation, corruption majeure, Quality Gate erroné ou tests critiques impossibles.
- **Élevé :** fonctionnalité critique incorrecte ou scénario de risque élevé non couvert.
- **Normal / faible :** défauts sans effet bloquant sur la décision de livraison, à accepter explicitement avec justification.

Ces niveaux sont une proposition et devront être validés lors de l'élaboration de la matrice de risques.

## 6. Quality Gates et critères d'entrée / sortie

**Definition of Ready :** ticket Jira identifié, critères vérifiables, responsabilités, risques/dépendances et stratégie de validation identifiés.

**Validation avant PR :** diff inspecté, absence de secrets, tests pertinents réussis, impact de la documentation examiné. Après activation CI, les contrôles requis doivent être verts ; ne jamais marquer un contrôle inexistant comme exécuté.

**Gate PR :** ticket lié, revue documentée, absence de défaut bloquant connu, résultats/preuves associés, approbation du propriétaire.

**Definition of Done :**
1. Critères d'acceptation satisfaits et risques traités ou acceptés explicitement.
2. Artefacts versionnés sur branche Jira et Pull Request passée en revue.
3. Tests applicables exécutés ; résultats, environnement et versions traçables ; pas de défaut bloquant ouvert.
4. Quality Gates effectivement configurés réussis, sans revendiquer des contrôles non disponibles.
5. Documentation Confluence/GitHub synchronisée et liens de preuve ajoutés au ticket.
6. Décision de validation humaine enregistrée, fusion effectuée puis statut Jira mis à jour.

Un résultat `BLOCKED` ou `NOT_RUN` ne doit jamais être présenté comme `PASS`.

## 7. Rôles et indépendance

Dans le MVP individuel, le propriétaire cumule les responsabilités PO/Tech Lead/QA. La revue personnelle et la revue assistée par IA ne constituent **pas** une revue indépendante. Ajouter une revue externe lorsque possible ; sinon déclarer précisément les limites de l'assurance.

## 8. Mesures de pilotage à introduire

Couverture des exigences critiques, taux de réussite des tests, défauts bloquants, latence API, taux de conformité des JSON générés, taux d'approbation humaine, échecs par catégorie, historique des évaluations de Gate. Définir dénominateurs, fenêtres et seuils avant publication d'indicateurs.

## 9. Décisions ouvertes

- Seuils numériques de couverture par risque.
- Choix de lint/formatage et pipeline CI initial ; protection effective de `main`.
- Jeu de référence et métriques d'évaluation IA.
- Environnements de tests, jeux de données et tolérances de performance.
- Conservation des logs, traces et données sensibles.

Cette stratégie est une **baseline de conception**, non une preuve d'exécution des contrôles envisagés.
