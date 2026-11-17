# QualityMind AI — Référentiel fonctionnel et diagrammes

**Version :** 1.0 · **Date de référence :** 16 novembre 2026 · **Périmètre :** MVP Requirements Intelligence (Sprint 5) et cible Enterprise · **Statut :** baseline documentaire à valider en recette.

## Source de vérité et ordre de priorité

1. [Catalogue officiel FR, NFR, AI, BR (Confluence)](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/262145) : exigences et identifiants **stables**. Ne pas renuméroter FR-008 et suivants.
2. [Jira Epic QA-5 et Sprint 5](https://gharbiconsulting.atlassian.net/browse/QA-5) : réalisation, anomalies, décisions de recette.
3. [Registre ADR canonique Confluence](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/2129927), [registre historique et alias](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/458771) et [ADR versionnées](../adr/ADR-001-modular-monolith.md) : ADR-001 à ADR-005 sans réutilisation d'identifiants.
4. **Ce dossier** : comportements observables du MVP et diagrammes du code versionné. Si le catalogue et le code divergent, documenter l'écart ; ne pas réécrire silencieusement une règle métier.

## Accès Confluence

- [Dossier fonctionnel et diagrammes — page d'entrée](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/2162689)
- [Spécification fonctionnelle du MVP](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/2162739)
- [Diagrammes d'états, flux et données](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/2228225)


## Documents

| Document | Objet |
| --- | --- |
| [Dossier fonctionnel](requirements-intelligence.md) | Acteurs, cas d'utilisation, règles métier, exceptions, critères de recette |
| [Diagrammes des états et parcours](diagrams.md) | Cycle de vie, archivage, import, workflow IA, diagrammes de séquence |
| [Modèle des données et contrats](data-contracts.md) | Diagramme entité-relation, dictionnaire et API, hypothèses |
| [Matrice de traçabilité](traceability.md) | FR/NFR/AI → Jira → preuves de tests, écarts ouverts |
| [Architecture as-built](../architecture/as-built-sprint5.md) | Composants réellement présents et cible séparée |
| [Stratégie QA](../qa/test-strategy.md) | Tests, environnements et critères de clôture |

## Cartographie produit

| Domaine | État novembre 2026 | Note |
| --- | --- | --- |
| Requirements Intelligence | Implémenté dans main, recette humaine en cours | CRUD, AC, workflow, import, archive, règles, revue IA |
| AI Test Design (FR-008 à 014) | Cible — **non livré** | Ne pas confondre proposition de test dans QA-90 et gestion des cas de test |
| Risk-Based Testing (FR-015 à 018) | Cible — non livré | Pas encore de moteur de score de risques métier |
| Automation Hub (FR-019 à 024) | Cible — non livré | Playwright/Pytest de notre CI ne constituent pas ce module métier |
| Intelligent Failure Analysis (FR-025 à 029) | Cible — non livré | Pas de classification d'échecs en application |
| Quality Governance (FR-030 à 036) | Cible — non livré | GitHub Actions Quality Gates ne sont pas des Quality Gates métier |
 
## Gouvernance de la documentation

- Toute évolution fonctionnelle lie **FR ou évolution identifiée → Jira → ADR si décision structurante → tests et PR**.
- Marquer **implémenté / en recette / prévu / non évalué**, pas seulement « Must ».
- Toute divergence de contrat ou règle doit être analysée avant modification du catalogue officiel.
- L'exécution OpenAI réelle dans l'environnement QA n'est pas une réussite validée tant que la clé, le budget, le consentement et un cas fictif n'ont pas été testés.
- RBAC, multi-tenancy, classification des données et déploiement public sont **non livrés** : ne pas exposer ce MVP avec des données confidentielles.
- Éviter les duplications : le catalogue Confluence reste la source de vérité pour les identifiants FR, NFR, AI et BR.
