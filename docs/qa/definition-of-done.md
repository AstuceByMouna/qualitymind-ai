# QualityMind AI — Definition of Ready et Definition of Done

**Version :** 1.0 — proposition soumise à validation  
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

## Limites actuelles du projet

La configuration des protections de branches, les workflows GitHub Actions, les seuils de couverture et le reporting automatisé ne sont **pas encore démontrés**. Leur mise en place fera l'objet de tâches de développement distinctes. Une revue assistée par IA sur un projet individuel ne constitue pas une revue indépendante.

## Utilisation pour QA-22

QA-22 est un ticket documentaire. Pour le clôturer : stratégie et DoD versionnées sur GitHub, liens Confluence, Pull Request revue/fusionnée, validation du contenu par le propriétaire et preuve sur `main`.
