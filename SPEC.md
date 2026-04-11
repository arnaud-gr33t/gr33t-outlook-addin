# Gr33t Recovery Layer — Outlook Add-in
## Descriptif fonctionnel

### Vue d'ensemble

Add-in Microsoft Outlook (Web + Desktop) qui affiche des indicateurs de recuperation issus de la plateforme Gr33t. L'objectif est de sensibiliser l'utilisateur a ses habitudes de travail : transitions entre reunions, multi-tache, debordement horaire, et temps de travail profond disponible.

**Version cible : 1.0.0**
**Plateforme : Outlook Web (OWA) + Outlook Desktop (Windows/Mac)**

---

### Architecture technique

#### Stack
- Office Add-in (Manifest XML ou JSON unified manifest)
- HTML/CSS/JS dans un TaskPane (panneau lateral)
- Microsoft Graph API (calendrier, mails, freebusy)
- MSAL.js pour l'authentification OAuth2 Microsoft
- Stockage : localStorage ou Office.context.roamingSettings

#### API Microsoft Graph utilisees

| Endpoint | Scope | Usage |
|----------|-------|-------|
| `GET /me/calendar/events` | `Calendars.Read` | Recuperer les reunions de l'utilisateur |
| `POST /me/calendar/getSchedule` | `Calendars.Read` | FreeBusy des participants (alertes transition) |
| `GET /me/mailFolders/sentItems/messages` | `Mail.Read` | Historique des mails envoyes (multi-tache, debordement) |
| `GET /me/profile` | `User.Read` | Identifier l'utilisateur |

#### Avantages par rapport a la version Chrome/GCal
- **API Mail complete** : acces direct a l'historique des mails envoyes (pas de scan DOM)
- **FreeBusy natif** : `getSchedule` fonctionne comme Google FreeBusy
- **Deploiement centralise** : deploiement via M365 Admin Center sans review AppSource
- **Multi-plateforme** : fonctionne sur Outlook Web, Windows et Mac

---

### Fonctionnalites

#### F1 : Dashboard de recuperation (TaskPane)

Panneau lateral accessible via un bouton dans le ruban Outlook. Affiche :

**Score du jour precedent (Indice de recuperation)**
- Score global sur 100 points
- Couleur : vert (>= 80), orange (50-79), rouge (< 50)

**4 facteurs de recuperation (chacun sur 25 points)**

| Facteur | Calcul | Detail |
|---------|--------|--------|
| **Multi-tache** | 25 x (reunions sans mail envoye pendant / total reunions) | Liste des reunions avec nombre de mails envoyes pendant |
| **Transitions** | 25 x (reunions avec >= 5 min avant ET apres / total) | Premiere reunion : condition "avant" toujours OK. Derniere : condition "apres" toujours OK |
| **Debordement** | 25 pts si aucune reunion hors 8h-20h ET aucun mail hors 8h-20h. -10 pts par mail hors plage. 0 pts si reunion hors plage | Liste des mails et reunions hors plage |
| **Travail profond** | 10 pts par heure de travail profond entre 1er et dernier mail (plage usuelle). Max 25 pts. 0 si aucun mail | Blocs >= 15 min sans reunion ni mail, sur 8h-12h30 + 13h30-20h |

**Sections repliables** : chaque facteur affiche la 1ere ligne de detail + "+ X autres..." cliquable.

**Courbe de tendance** : graphique sur 3 semaines avec les scores reels jour par jour.

#### F2 : Alertes de transition (Event creation)

Lors de la creation/modification d'un evenement dans Outlook :

- Pour chaque participant, afficher le temps disponible avant et apres la reunion proposee
- Si gap > 60 min : pas d'alerte
- Si gap <= 60 min : afficher "X min disponibles avant/apres"
- Si chevauchement : afficher "Indisponible de HH:MM a HH:MM"
- Utilise l'API `getSchedule` (equivalent FreeBusy Google)
- Exclure l'organisateur des alertes (Outlook affiche deja ses conflits)

#### F3 : Scan des mails envoyes

Contrairement a la version Chrome (qui necessite un scan DOM fragile), la version Outlook utilise directement l'API Microsoft Graph :

```
GET /me/mailFolders/sentItems/messages
  ?$filter=sentDateTime ge 2026-04-01T00:00:00Z and sentDateTime lt 2026-04-08T00:00:00Z
  &$select=sentDateTime
  &$top=100
```

- Recupere les horodatages de tous les mails envoyes sur la periode
- Pas besoin de Gmail ouvert, pas de scan DOM, pas de MutationObserver
- Historique complet disponible
- Declenchement : automatique a l'ouverture du TaskPane, ou bouton "Actualiser"

#### F4 : Donnees 100% locales

- Toutes les donnees sont stockees en local (localStorage)
- Aucune donnee transmise a un serveur Gr33t
- Expiration automatique des donnees apres 90 jours
- Les API Microsoft Graph sont appelees avec le token de l'utilisateur

---

### Filtrage des reunions

Une reunion est prise en compte si :
- Au moins 2 participants (organisateur + 1 invite)
- L'utilisateur a accepte la reunion (responseStatus != "declined" et != "none")
- Ce n'est pas un evenement "toute la journee"

---

### Plages horaires

| Plage | Horaires |
|-------|----------|
| Travail usuel | 8h00-12h30 + 13h30-20h00 |
| Pause dejeuner | 12h30-13h30 (exclue) |
| Hors plage (debordement) | Avant 8h00 ou apres 20h00 |

---

### Interface utilisateur

#### Bouton ruban
- Icone "mindfulness" dans le ruban Outlook
- Ouvre le TaskPane lateral

#### TaskPane (panneau lateral)
- Largeur : ~320px
- Contenu :
  1. En-tete avec score du jour precedent (cercle colore + pourcentage)
  2. 4 facteurs avec sections repliables
  3. Bouton "Actualiser les donnees"
  4. Courbe de tendance (3 semaines)
  5. Footer QVCT

#### Alertes transition (event form)
- Affichees dans le TaskPane quand un evenement est en cours de creation
- Detecte l'evenement en cours via `Office.context.mailbox.item`
- Liste les participants avec leur disponibilite

---

### Deploiement

#### Option 1 : M365 Admin Center (recommande pour usage interne)
- Pas de review Microsoft/AppSource
- L'admin M365 deploie directement l'add-in pour les utilisateurs du domaine
- Deploiement immediat

#### Option 2 : AppSource (marketplace publique)
- Review Microsoft obligatoire
- Visible publiquement
- Pour une version commerciale future

#### Processus de deploiement interne
1. Generer le manifest (XML ou JSON unified)
2. Heberger les fichiers web (HTML/JS/CSS) sur un serveur HTTPS (ex: Azure Static Web Apps, ou gr33t.fr)
3. Admin M365 → Centre d'administration → Applications integrees → Deployer un add-in personnalise
4. Selectionner les utilisateurs ou groupes cibles
5. L'add-in apparait dans Outlook pour les utilisateurs selectionnes

---

### Differences avec la version Chrome/GCal

| Aspect | Chrome Extension (GCal) | Outlook Add-in |
|--------|------------------------|-----------------|
| UI | Injection DOM (barres, popovers) | TaskPane lateral |
| Barres colorees sur events | Oui (injection DOM) | Non (pas possible dans Outlook) |
| Score dans le calendrier | Bandeau all-day injecte | Bouton ruban + TaskPane |
| Detection mails | DOM scraping Gmail + scan recherche | API Graph directe (historique complet) |
| Scan historique | Manuel (bouton "Actualiser") | Automatique (API directe) |
| FreeBusy | Google FreeBusy API | Microsoft Graph getSchedule |
| Deploiement | Chrome Web Store + review | M365 Admin Center (immediat) |
| Stockage | chrome.storage.local | localStorage / roamingSettings |

---

### Estimation de developpement

| Phase | Scope | Estimation |
|-------|-------|-----------|
| 1 | Setup projet + auth MSAL + API Graph calendrier | 1-2 jours |
| 2 | TaskPane dashboard (score, 4 facteurs, sections repliables) | 1-2 jours |
| 3 | API mails envoyes + calcul multi-tache et debordement | 1 jour |
| 4 | FreeBusy + alertes transition dans event form | 1 jour |
| 5 | Courbe de tendance | 0.5 jour |
| 6 | Deploiement M365 + tests | 0.5 jour |
| **Total** | | **5-7 jours** |
