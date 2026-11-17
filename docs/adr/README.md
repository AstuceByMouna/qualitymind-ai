# Registre des Architecture Decision Records — QualityMind AI

**Date de consolidation :** 16 novembre 2026. **Gouvernance canonique :** [Registre ADR Confluence](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/2129927). Un ID = une décision. Ne jamais réutiliser un identifiant, et documenter tout remplacement par une nouvelle ADR.

## ADR canoniques

| ID | Décision | Référence détaillée | Statut de décision | État d'implémentation |
| --- | --- | --- | --- | --- |
| ADR-001 | Architecture monolithe modulaire | [ADR-001](ADR-001-modular-monolith.md) | Retenue | Requirements Intelligence intégré |
| ADR-002 | Lifecycle Draft / In Review / Ready | [ADR-002](ADR-002-requirement-lifecycle.md) | Accepted | Intégré, recette humaine en cours |
| ADR-003 | Archivage/restauration réversible | [ADR-003](ADR-003-requirement-archiving.md) | Proposed dans le document initial, à ratifier | Intégré, recette humaine en cours |
| ADR-004 | Import CSV/XLSX avec preview et confirmation | [ADR-004](ADR-004-requirement-import.md) | Proposed dans le document initial, à ratifier | Intégré, recette humaine en cours |
| ADR-005 | Tests UI Playwright progressifs | [ADR-005 (Confluence)](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/1409025) | Acceptée pour le MVP | Fondations et CI Playwright en place |

Les références historiques de l'ancien « registre architecture » ne sont pas les IDs canoniques. Mapping :
- Ancien ADR-002 « LLMProvider » → DEC-H02 (choix historique)
- Ancien ADR-003 « Validation humaine IA » → DEC-H03
- Ancien ADR-004 « Quality Gates déterministes » → DEC-H04
- Ancien ADR-005 « PostgreSQL » → DEC-H05 (pris en compte dans ADR-001)
- Ancien ADR-006 « Tests isolés » → DEC-H06 (cible)
- Ancien ADR-007 « Revue IA externe » → DEC-H07 (choix de fournisseur non arrêté)
- Ancien ADR-002 « Playwright » → **ADR-005 canonique**

Ces correspondances conservent la traçabilité des anciens tickets/commits. Elles ne donnent pas une approbation rétroactive aux décisions non validées.

## Convention de changement

1. Ajouter une ADR datée : contexte, options, décision, conséquences, risques, auteur/responsable, statut et liens Jira/PR/tests.
2. Distinguer le statut de décision (Proposed / Accepted / Superseded / Rejected) de l'état d'implémentation et d'acceptation UAT.
3. Faire approuver les règles structurantes avant modification du code ; joindre les changements de diagrammes et tests à la PR.
4. Conserver les anciennes versions et préciser les remplacements ; Confluence pilote le registre, GitHub les ADR versionnées.
5. Ne pas confondre « intégré/CI verte » avec « recette humaine signée » ou « production Enterprise ».

[Portail de gouvernance](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/overview) · [Stratégie SDLC](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/458753) · [Risques](https://gharbiconsulting.atlassian.net/wiki/spaces/KAN/pages/2195469)
