# Dossier fonctionnel — Requirements Intelligence

**Baseline :** Sprint 5, 16 novembre 2026. **Références :** FR-001 à FR-007, QA-49, QA-53/54, QA-82/84/85, QA-87, QA-90, QA-94 à 101. **Statut :** code intégré, recette humaine encore ouverte.

## Finalité et utilisateurs

Le module permet à un QA Analyst / QA Architect / Product Owner (profils cibles du catalogue) de centraliser les exigences SaaS, qualifier leur testabilité, conserver les critères d'acceptation et prendre une décision humaine sur les recommandations. L'application actuelle n'a **pas** d'authentification ou d'autorisation par rôle : ces profils décrivent les futurs droits, pas des permissions actuellement appliquées.

## Cas d'utilisation MVP

| ID de cas | Déclencheur / parcours | Résultat attendu | Références |
| --- | --- | --- | --- |
| UC-01 | Créer manuellement un titre et une description | UUID unique, statut `Draft`, fiche persistée | FR-001, FR-003, QA-49/82 |
| UC-02 | Afficher registre et rechercher globalement | Résultats paginés, total cohérent, détail ou 404 | FR-004, QA-53/54/85 |
| UC-03 | Modifier titre et description | Contrôle taille, valeurs à jour, UUID inchangé | FR-004, QA-84/101 |
| UC-04 | Ajouter, modifier, supprimer un critère | Contenu sauvegardé, ordre maintenu, confirmation avant suppression | FR-005, QA-94 |
| UC-05 | Déplacer une exigence entre statuts autorisés | Historique append-only, 409 pour transition interdite | FR-007, QA-95 |
| UC-06 | Archiver puis restaurer | Exclue du registre actif, conservée et restaurable | QA-97 (extension ; ID FR non attribué) |
| UC-07 | Importer CSV/XLSX : prévisualiser puis confirmer | Aucun requis avant confirmation, doublons ignorés, lien vers fiche | FR-002, QA-87/98/99/100 |
| UC-08 | Analyser la testabilité par règles | Signalements motivés, source inchangée | FR-006, QA-96 |
| UC-09 | Demander une revue OpenAI facultative | Consentement + contrôle sensible ; suggestions structurées/historisées | QA-90, AI-001/002/003/005/006 |
| UC-10 | Accepter, modifier ou rejeter une suggestion IA | Décision unique enregistrée, source inchangée | QA-90, AI-005 |

## Règles métier et validations

- `Requirement` : titre 1–255 caractères, description 1–10 000 après normalisation, pas de NUL. UUID stable ; modification par PATCH ne concerne que titre et description.
- `AcceptanceCriterion` : texte 1–2 000 caractères ; une exigence peut en avoir zéro à plusieurs ; `position` ordonne les critères et est renumérotée après suppression.
- **États** : création en `Draft`, transitions autorisées décrites dans [les diagrammes](diagrams.md) ; `Ready` ne constitue jamais une autorisation de livraison.
- **Archivage** : indicateur indépendant du statut ; conserve UUID, critères et historique ; double archive/restaure est idempotent ; recherche par défaut exclut les archives.
- **Import** : fichier UTF-8 CSV ou XLSX, max 2 MiB / 500 lignes ; colonnes `external_id,title,description` et facultatives `priority,acceptance_criteria` ; `mapping` JSON facultatif ; lot en `preview` puis `confirmed`. Une seule cellule de critères peut créer **un** critère. L'import ne met pas à jour les exigences existantes ; clé de déduplication = nom de fichier + external_id (limitation MVP).
- **Confirmation** : des lignes rejetées bloquent la confirmation du lot ; aucun enregistrement métier pendant la prévisualisation ; pour une ligne créée, navigation vers sa fiche ; pour plusieurs, récapitulatif et liens.
- **QA-96** : moteur Python déterministe versionné, vérifie vocabulaire vague, acteur, déclencheur, résultat attendu et présence de critères ; les signalements sont des indices susceptibles de faux positifs, pas des défauts prouvés.
- **QA-90** : analyse OpenAI uniquement pour une exigence **importée, active**, consentement explicite et confirmation de non-sensibilité à chaque exécution. Blocage de motifs sensibles évidents, taille bornée, clé et modèle côté serveur ; aucune transmission lors du seul affichage de la page ; réponse Pydantic structurée.
- **Décisions IA** : `pending → accepted / edited / rejected` ; une décision ne s'applique ni au texte de l'exigence ni aux critères. Si la source change après analyse, la revue de l'ancien résultat est refusée (`stale` calculé à partir de l'empreinte).
- **Erreurs** : 404 ressource absente ; 422 entrée invalide ; 409 conflit métier ; 503 fournisseur IA indisponible/non configuré ; aucun échec IA ne doit faire perdre l'exigence.

## Scénarios de recette UAT à couvrir

1. Création → consultation → modification → réouverture → persistance des valeurs (y compris QA-101 après ajout de critères).
2. Critères : ajouter, éditer, annuler, supprimer avec confirmation et contrôle de l'ordre.
3. Cycle : transitions valides, tentative invalide (409), historique et conservation après rafraîchissement.
4. Archive → absence du registre actif → restauration → mêmes UUID/critères/historique.
5. Import : nom long visible, aperçu complet sans écriture, doublon, ligne rejetée, confirmation unitaire et multi-lignes, navigation.
6. QA-96 : terme vague produit un signalement, source inchangée ; texte vérifiable n'entraîne pas de signalement artificiel.
7. QA-90 : sans consentement aucun appel, hors provenance refusé, clé absente 503, mock CI sans réseau, revue humaine, résultat périmé, puis recette **réelle** sur données fictives avec budget.
8. Pannes API, requête invalide et changement d'état concurrent : erreurs compréhensibles et aucune modification silencieuse.

**Verdict :** tests CI verts ≠ recette manuelle signée. Voir [matrice](traceability.md) pour la preuve et le statut.

## Hors périmètre ou évolutions

Authentification/RBAC, multi-tenant, gestion des droits objet, vrai DLP, moteur de test cases, calcul risque métier, exécution de tests depuis l'application, quality gates métier, file Redis/worker, production et observabilité complète. Les besoins de ces modules figurent dans le catalogue officiel, mais ne sont pas des capacités déjà livrées.
