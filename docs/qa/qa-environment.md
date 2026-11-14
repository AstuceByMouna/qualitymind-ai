# QualityMind AI — Environnement TEST/QA isolé

**Ticket :** [QA-72](https://gharbiconsulting.atlassian.net/browse/QA-72)  
**Architecture :** DEV et TEST/QA peuvent tourner en parallèle sur le même PC, sans partager la base PostgreSQL ni le répertoire de build Next.js.

## 1. Topologie

| Composant | DEV | TEST/QA |
| --- | --- | --- |
| Frontend | http://127.0.0.1:3000 | http://127.0.0.1:3001 |
| FastAPI | http://127.0.0.1:8000 | http://127.0.0.1:8001 |
| PostgreSQL | 127.0.0.1:5432 | 127.0.0.1:5433 |
| Base de données | `qualitymind` | `qualitymind_qa` |
| Docker Compose | `compose.yaml` | `compose.qa.yaml` |
| Docker volume | `qualitymind_pgdata` (DEV) | `qualitymind-qa_qa_pgdata` (QA) |
| Next.js cache | `frontend/.next` | `frontend/.next-qa` |
| Playwright config | `playwright.config.ts` | `playwright.qa.config.ts` |

La base `qualitymind_test` déjà utilisée par le backend CI est **distincte** de `qualitymind_qa`, utilisée ici pour les tests UI intégrés locaux.

## 2. Préparation unique — Windows Git Bash

Depuis la racine du dépôt, avec Docker Desktop lancé :

```bash
cp .env.qa.example .env.qa
```

Éditer `.env.qa` avec un mot de passe QA local **différent de DEV**. Ne jamais commiter ce fichier. Son seul paramètre requis est `QA_POSTGRES_PASSWORD`; le script construit l'URL de connexion QA avec encodage du mot de passe.

La base DEV continue d'utiliser `.env`. Le script QA remplace explicitement `DATABASE_URL`, `POSTGRES_DB`, `CORS_ORIGINS`, `API_BASE_URL` et le dossier Next.js dans ses processus enfants.

## 3. Démarrer l'environnement QA

Dans **Terminal A** (Git Bash, racine) — PostgreSQL QA puis migrations :

```bash
backend/.venv/Scripts/python.exe scripts/qa_env.py db-up
backend/.venv/Scripts/python.exe scripts/qa_env.py migrate
```

Résultat attendu : `PASS: isolated QA database qualitymind_qa` et migrations appliquées sur `qualitymind_qa`, jamais sur `qualitymind`.

Dans **Terminal B** (nouveau Git Bash, racine) — FastAPI QA :

```bash
backend/.venv/Scripts/python.exe scripts/qa_env.py api
```

Laisser ce terminal ouvert. Swagger QA : <http://127.0.0.1:8001/docs>.

Dans **Terminal C** (nouveau Git Bash, racine) — Next.js QA :

```bash
backend/.venv/Scripts/python.exe scripts/qa_env.py frontend
```

Laisser ce terminal ouvert. Frontend QA : <http://127.0.0.1:3001>.

Dans **Terminal D** (Git Bash, racine) — Vérifier les trois services :

```bash
backend/.venv/Scripts/python.exe scripts/qa_env.py check
```

Résultat attendu : **3 PASS** (DB, API et frontend QA).

## 4. Lancer Playwright uniquement contre QA

Dans **Terminal D** :

```bash
cd frontend
npm run test:e2e:qa
```

La configuration QA définit `baseURL = http://127.0.0.1:3001` et **ne démarre ni ne réutilise automatiquement le serveur DEV**. Si QA n'est pas démarré, les tests échouent au lieu de tomber sur DEV.

Les scénarios QA-82 qui simulent l'API utilisent `page.route()`. Ils ne prouvent pas la persistance PostgreSQL. Pour un vrai E2E intégral, créer un scénario explicitement identifié `@real-api` qui utilise `qualitymind_qa`, génère des données uniques et nettoie ses enregistrements via une stratégie contrôlée (non inclus ici).

## 5. Arrêt et sécurité

Arrêter FastAPI QA et Next.js QA avec **Ctrl+C** dans leurs terminaux respectifs. Puis, dans la racine du dépôt :

```bash
backend/.venv/Scripts/python.exe scripts/qa_env.py db-down
```

Ceci arrête **uniquement** les conteneurs QA ; aucune option `--volumes` n'est exécutée. Les données QA persistent entre les exécutions.

### Règles de protection

- Ne jamais utiliser `qualitymind` (DEV) pour les tests de création/destruction automatisés.
- Ne jamais commiter `.env.qa` ni afficher son mot de passe dans les rapports.
- Le script `scripts/qa_env.py` vérifie l'identité réelle de la base et de l'utilisateur PostgreSQL avant d'appliquer les migrations ou de démarrer FastAPI.
- Le frontend QA utilise le serveur FastAPI QA via la variable d'environnement `API_BASE_URL`.
- Le répertoire `.next-qa` est exclu de Git, distinct du cache Next.js DEV.
- Les tests Playwright en mode QA restent **locaux** jusqu'à l'ajout du job CI E2E (QA-80).
- Les services QA n'ont pas été démarrés par ce commit : valider sur le poste de développement avant d'annoncer un environnement opérationnel.

## 6. Prochain incrément

Après validation locale : ajouter un vrai test `@real-api` de création/consultation sur `qualitymind_qa`, une stratégie de données et nettoyage QA, puis intégrer ces tests dans GitHub Actions avec artefacts JUnit/HTML/traces.
