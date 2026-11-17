# Diagrammes des états et des parcours — Requirements Intelligence

**Périmètre :** comportements codés dans `backend/app/modules/requirements/application/lifecycle.py`, `backend/app/api/v1/imports.py`, `backend/app/api/v1/ai_analysis.py`, modèles PostgreSQL et frontend associé. Les diagrammes reflètent le code, pas des hypothèses de futur module.

## D-01 — États métier d'une exigence (QA-95 / FR-007)

```mermaid
stateDiagram-v2
    [*] --> Draft: création manuelle ou import confirmé
    Draft --> "In Review": demander revue
    "In Review" --> Ready: marquer prêt
    "In Review" --> Draft: retour correction
    Ready --> Draft: rouvrir
```

**Transitions autorisées :** Draft→In Review, In Review→Ready, In Review→Draft, Ready→Draft. Toute transition non décrite (y compris vers le même état) renvoie 409. `Ready` n'est pas une décision Go/No-Go ; l'historique persiste séparément.

## D-02 — Archivage orthogonal au cycle de vie (QA-97)

```mermaid
stateDiagram-v2
    [*] --> Active
    Active --> Archived: archiver avec confirmation
    Archived --> Active: restaurer
    Archived --> Archived: archive répétée (idempotente)
    Active --> Active: restauration répétée (idempotente)
```

Le statut `Draft/In Review/Ready` ne change pas lors d'une archive/restauration. La fiche individuelle demeure consultable ; seuls le registre et la recherche par défaut masquent les archives.

## D-03 — Lot d'import (QA-87/98/99/100)

```mermaid
stateDiagram-v2
    [*] --> Preview: POST /imports/preview
    Preview --> Preview: consulter le lot
    Preview --> Preview: confirmation bloquée si lignes rejetées (409)
    Preview --> Confirmed: POST /imports/{batch}/confirm
    Confirmed --> Confirmed: confirmation répétée (idempotente)
```

Le lot `Preview` est déjà persisté comme **rapport de staging**, mais les exigences ne le sont pas. Les lignes portent les décisions `create`, `ignore`, `reject` ; les lignes rejetées interdisent la confirmation. La prévisualisation complète montre les données avant validation ; une nouvelle analyse de fichier crée un **nouveau** lot.

## D-04 — Analyse et suggestion IA (QA-90)

```mermaid
stateDiagram-v2
    state "Analyse IA" as Run {
        [*] --> Processing: consentement explicite + source éligible
        Processing --> Completed: Structured Output valide
        Processing --> Failed: erreur modèle, délai ou quota
    }
    state "Décision humaine sur suggestion" as Review {
        [*] --> Pending: suggestion conservée
        Pending --> Accepted: accepter
        Pending --> Edited: corriger et enregistrer
        Pending --> Rejected: rejeter
    }
```

`stale` est un **indicateur calculé** par comparaison d'empreinte du contenu actuel, pas un quatrième statut d'analyse. Une suggestion revue ne peut pas être revue une seconde fois. Une suggestion de test issue de QA-90 n'est **pas** encore un objet `TestCase` du futur module AI Test Design.

## D-05 — Séquence d'import (QA-87)

```mermaid
sequenceDiagram
    actor U as QA Analyst
    participant UI as Next.js
    participant API as FastAPI
    participant DB as PostgreSQL QA
    U->>UI: Sélectionner CSV ou XLSX
    U->>UI: Preview
    UI->>API: POST /api/v1/imports/preview
    API->>DB: Enregistrer le lot et les décisions par ligne
    DB-->>API: batch_id, preview
    API-->>UI: champs complets + create/ignore/reject
    UI-->>U: Afficher contenu et erreurs
    alt Ligne rejetée
        U->>UI: Corriger le fichier et prévisualiser à nouveau
    else Lot admissible
        U->>UI: Confirm import
        UI->>API: POST /api/v1/imports/{batch_id}/confirm
        API->>DB: Transaction atomique + UUID + critères
        API-->>UI: confirmed + UUID des exigences
        UI-->>U: Navigation fiche ou résumé multi-lignes
    end
```

## D-06 — Séquence de revue OpenAI et décision humaine (QA-90)

```mermaid
sequenceDiagram
    actor QA as QA humain
    participant UI as Next.js
    participant API as FastAPI
    participant DB as PostgreSQL
    participant LLM as OpenAI externe
    QA->>UI: Choisir exigence importée active
    QA->>UI: Accepter les deux confirmations
    UI->>API: POST /requirements/{id}/ai-analysis
    API->>API: Vérifier éligibilité, sensibilité, taille et clé
    API->>DB: Historiser run et empreinte
    API->>LLM: Champs nécessaires uniquement, store=false
    alt Succès
        LLM-->>API: Suggestions JSON structuré
        API->>API: Validation Pydantic
        API->>DB: Enregistrer suggestions pending
        API-->>UI: Rapport traçable, modèle, prompt
        QA->>UI: Accepter, corriger ou rejeter
        UI->>API: POST /review
        API->>API: Recalculer empreinte, refuser stale
        API->>DB: Enregistrer décision humaine
        API-->>UI: Revue enregistrée, exigence inchangée
    else Échec
        LLM-->>API: Délai, quota, réponse invalide
        API->>DB: Run failed, code générique
        API-->>UI: Erreur sans altérer la source
    end
```

**Important :** les diagrammes de Quality Gate Go/No-Go et de création d'objets TestCase seront ajoutés quand leurs services existeront ; les dessiner comme livrés induirait en erreur.
