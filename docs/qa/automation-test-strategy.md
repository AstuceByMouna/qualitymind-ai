QualityMind AI — Stratégie d'automatisation des tests
US : QA-69 · Sous-tâche : QA-55
Version : 0.2 — revue proposée · Date : 12 novembre 2026
Périmètre : Requirements Intelligence MVP (QA-49, QA-53, QA-54)
Matrice : docs/qa/test-coverage-matrix.md (v0.3)
1. Objectif et principes
Construire des tests fiables, isolés, reproductibles et traçables. Chaque affirmation « couvert » doit pointer vers une exigence, un cas, un résultat, un environnement et un commit. Ne pas multiplier inutilement les mêmes tests dans plusieurs outils. Séparer état actuel, cible et preuve.
2. État actuel / cible
Capacité	Aujourd'hui	Cible et ticket
Backend Pytest	35 tests réussis localement sur qualitymind_test	Compléter les lacunes pertinentes (QA-73)
Backend CI	backend-ci.yml : installation, PostgreSQL, migration aller-retour et Pytest	JUnit et couverture en CI (QA-80)
Couverture	97 % localement, 148 instructions dont 5 manquantes	Rendre pytest-cov reproductible via dépendance de développement et CI (QA-73/80)
Postman	Workflow postman-ci.yml avec collection Cloud par ID et condition POSTMAN_CI_ENABLED=true	Vérifier l'activation et versionner ou gouverner la collection (QA-69)
Frontend	Scripts npm run lint et npm run build présents	Job frontend CI bloquant après configuration (QA-80)
Playwright	Pas de dépendance ni de suite frontend Playwright installée	Framework, scénarios et CI (QA-70 à QA-80)
Rapports	Pas d'artefacts JUnit, couverture ou Playwright déclarés dans les workflows examinés	Rapports JUnit, couverture, HTML et traces (QA-80)
Protection de main	Le check backend est prévu pour être exigé ; état du ruleset non revérifié dans cette revue	Vérifier les réglages GitHub et les checks réellement requis (QA-80)


Important : l'existence d'un workflow n'atteste ni son exécution réussie ni son caractère obligatoire dans les règles de branche.
3. Responsabilités par niveau de test
Niveau	Outil	Responsabilité
Schéma et composants Python	Pytest	Validation, normalisation et exceptions
API / contrat	Pytest + FastAPI TestClient (transport HTTPX)	201, 200, 404, 422, schémas, pagination
Intégration	Pytest + PostgreSQL de test	Persistance, ordre, migrations et requêtes réelles
Smoke / régression HTTP	Postman CLI	Collection partageable et démonstration sur API démarrée ; éviter la copie de tous les tests Pytest
UI / E2E	Playwright Test + TypeScript	Parcours navigateur → Next.js → FastAPI → PostgreSQL


Politique des mocks : utiliser mocks pour chemins d'erreur difficiles à provoquer ; ne jamais s'appuyer sur un mock seul pour prouver la persistance ou l'ordre réel. Privilégier PostgreSQL isolé pour les tests de base et quelques E2E réels ciblés pour l'interface. Qualifier chaque preuve comme mock, API réelle, DB réelle ou E2E.
4. Baseline et couverture vérifiées
- Code de référence : commit 32e50252556ec5b084e792af6330b5edb583dbed.
- Local : Windows/Git Bash, Python 3.14.6, Pytest 9.2.0, PostgreSQL 17.11, POSTGRES_DB=qualitymind_test confirmé par SQLAlchemy.
- Tests : python -m pytest -v → 35 passed, 1 warning in 1.58s.
- Couverture : python -m pytest --cov=app --cov-report=term-missing → 148 instructions, 5 manquantes, 97 % ; 35 passed, 1 warning en 1.53s.
- Lacunes : app/db.py (lignes 18–22 et 29 : chemins de configuration), app/schemas/requirement.py (ligne 28 : type non textuel).
- Limite : couverture des instructions, non des branches ni des exigences. La mesure externe de 157 instructions ne peut pas être comparée sans harmoniser le périmètre.
- Reproductibilité cible : déclarer pytest-cov dans les dépendances de développement, documenter le périmètre app/, exécuter la mesure en CI et générer un rapport. La mesure de 97 % est locale, pas encore mesurée par la CI.
5. API et défauts à qualifier
Scénarios existants : création 201, lecture 200, absent 404, paramètres invalides 422, validations, liste vide et paginée, ordre, PostgreSQL, santé, CORS, OpenAPI.

Un surrogate Unicode isolé (\ud800) provoquant HTTP 500 a été signalé par une revue externe, mais n'est pas encore reproduit localement. Le reproduire sur la base dédiée et créer un Bug Jira si confirmé. L'acceptation des champs inconnus nécessite d'abord une décision de contrat : ne pas présumer qu'elle constitue un défaut. Le scénario global de validation reste PARTIEL.

Les tests ciblant les cinq instructions non couvertes sont à évaluer sous QA-73 ; aucun objectif arbitraire de 100 %.
6. UI / Playwright
Ordre de réalisation : TC-006 (registre), TC-009 (détail), TC-011 (API indisponible), TC-010 (404), TC-007 (pagination), TC-008 (recherche locale). La liste des AC et risques se trouve dans la matrice.
- Utiliser getByRole/`getByLabel`, assertions web-first, pas de waitForTimeout pour synchroniser.
- TC-007 : créer au moins six exigences en données de test pour vérifier les pages de cinq éléments.
- TC-008 : vérifier explicitement que le filtre cherche seulement sur la page courante, pas dans toute la base.
- TC-010 : un identifiant invalide retourne 404 sans appel API ; un UUID valide inconnu déclenche GET puis 404.
- TC-011 : les appels FastAPI sont déclenchés côté serveur Next.js ; page.route() n'intercepte pas ces appels. Utiliser une instance Next configurée avec API_BASE_URL injoignable ou un service API de test contrôlé.
- Configuration cible : Playwright TypeScript, Chromium d'abord, baseURL, webServer, headless CI, screenshots sur échec, rapport HTML + JUnit, traces en cas d'échec.
- Retries : zéro en local, au maximum un en CI pendant la stabilisation, avec trace du premier échec. Toute mise en quarantaine d'un flaky doit avoir un ticket, un responsable et une date de révision.
7. Données et environnements
- Développement : base qualitymind ; tests : qualitymind_test ; CI : PostgreSQL éphémère.
- Vérifier le nom de la base et arrêter les tests E2E si l'environnement n'est pas celui prévu.
- Appliquer les migrations Alembic, puis créer les données via POST API ou fixtures SQLAlchemy documentées si besoin de dates et d'ordre contrôlés.
- Identifier chaque lot de données de test et ne nettoyer que les enregistrements créés ; aucune donnée de production.
- Isoler les scénarios d'indisponibilité de l'API des scénarios réels.
- Ne jamais exposer de secrets, tokens, mots de passe ou données personnelles dans les logs et artefacts.
Implémentation des fixtures : QA-72.
8. Pipeline CI cible et artefacts
Le backend CI exécute déjà ses migrations et Pytest ; le workflow Postman démarre FastAPI et exécute la collection si son option est activée. Aucun job frontend/Playwright n'est encore dans les deux workflows examinés.

Cible QA-80 : installer Python/Node, démarrer PostgreSQL test, appliquer migrations, faire npm ci, lint/build, démarrer API et Next.js, vérifier la disponibilité des services, préparer fixtures, exécuter Playwright, nettoyer, publier les rapports.

Artefacts cibles : JUnit XML, couverture backend XML/HTML, rapport Playwright HTML, traces et screenshots lors des échecs. Conservation proposée : 7 jours, à configurer. Vérifier la confidentialité avant publication. Versionner la collection Postman (export approuvé) ou formaliser une politique de revue et de version pour l'ID Cloud.
9. Quality Gates mesurables
Gate	Source / seuil	Bloquant ?	État
Backend	FastAPI / Pytest / PostgreSQL : 100 % des tests de suite réussis	Oui si requis dans le ruleset	Job existant ; protection à revérifier
Frontend	Lint et build : codes de sortie 0	Oui après mise en place	Cible QA-80
Smoke UI	TC-006 et TC-009 : 2 tests réussis sans échec non résolu	Oui après stabilisation	Cible QA-80
Couverture backend	>= 97 % d'instructions, périmètre comparable	Indicatif initialement	Mesure locale seulement
Traçabilité	0 identifiant TC cassé	Indicatif puis bloquant	Contrôle à développer
Bugs critiques	0 défaut critique ouvert et non accepté formellement	Revue manuelle	Gouvernance
Secrets exposés	0 secret confirmé dans les artefacts	Oui	Contrôle à mettre en place


Les gates cibles ne sont pas déclarés actifs tant que les workflows et règles GitHub n'ont pas été vérifiés.
10. Hors périmètre actuel : évaluation des modules IA
Le futur module AI Test Design aura besoin d'un dispositif distinct : jeux de référence versionnés, validité des sorties structurées, pertinence, répétabilité/variance, couverture des cas générés, prompt injection, tests adversariaux et revue humaine. Le répertoire evaluation/ est une option architecturale, non une fonctionnalité livrée, à décider avant implémentation.
11. Traçabilité et responsabilité
La matrice docs/qa/test-coverage-matrix.md est la référence des TC-001 à TC-015, des risques R-001 à R-007, des liens QA-49/53/54 et des preuves. Chaque test doit relier AC → risque → niveau → fonction → environnement → commit → exécution. Un résultat PASS de test ne signifie pas que l'exigence entière est couverte.
12. Plan Jira
Ticket	Livrable
QA-55	Stratégie, matrice et baseline
QA-70	Configuration Playwright
QA-71	Smoke test et locators
QA-72	Fixtures et données isolées
QA-73	Compléments Pytest/HTTPX
QA-74 à QA-77	Parcours UI et erreurs
QA-78 à QA-79	Debug, accessibilité et fiabilité
QA-80	CI frontend/Playwright et artefacts
QA-81	Bilan, traçabilité et revue finale


13. Critères de clôture QA-55
- [x] Baseline Pytest : 35/35 tests verts.
- [x] Couverture locale : 97 %, sur app/.
- [x] Principaux risques R-001 à R-007 identifiés.
- [ ] Aligner la matrice v0.3 sur la stratégie et qualifier les preuves manquantes.
- [ ] Statuer sur le signalement Unicode (reproduit ou non), créer un Bug si confirmé.
- [ ] Rattacher les preuves CI et confirmer les checks GitHub réellement requis.
- [ ] Approuver les documents après revue.
- [ ] Créer un commit sur docs/QA-55-test-strategy, ouvrir puis fusionner la PR après validations.
Les développements Playwright et les modifications CI relèvent des autres sous-tâches de QA-69, non de la clôture de QA-55.