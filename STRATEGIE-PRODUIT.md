# Gr33t Recovery Layer pour Outlook — Stratégie Produit

**Version** : 1.0
**Date** : Avril 2026
**Statut** : Note de cadrage

---

## 1. Vision

Gr33t Recovery Layer pour Outlook est un add-in Microsoft 365 qui donne à chaque utilisateur une visibilité sur ses habitudes de travail et ses facteurs de récupération, directement dans son environnement Outlook.

L'add-in affiche un score de récupération quotidien, décliné en quatre facteurs (multi-tâche, transitions, débordement horaire, travail profond), accompagné d'une mini-timeline visuelle de la journée et d'indicateurs actionnables.

L'objectif est double :
- Sensibiliser l'utilisateur à ses propres rythmes de travail
- S'inscrire dans une démarche QVCT (Qualité de Vie et Conditions de Travail) de l'entreprise

---

## 2. Deux versions produit

Le produit est décliné en **deux versions distinctes**, correspondant à deux contextes commerciaux et deux architectures techniques.

### 2.1 Gr33t Solo — Add-in autonome

**Positionnement** : L'add-in éthique, 100% local, pour individus et PME.

**Cible** :
- Utilisateurs individuels
- PME sans plateforme Gr33t centrale
- Pilotes exploratoires en amont d'un contrat entreprise
- Organisations sensibles à la confidentialité qui veulent auditer que les données ne quittent pas le poste

**Architecture** : Client-only. L'add-in appelle directement Microsoft Graph pour récupérer les événements du calendrier et les métadonnées des mails envoyés, puis calcule les scores localement dans le TaskPane.

**Flux de données** :

```
Outlook (utilisateur)
    ↓ Office.js + MSAL
Microsoft Graph API
    ↓ Calendars.Read + Mail.ReadBasic + User.Read
TaskPane Gr33t (calcul local)
    ↓
roamingSettings (stockage local, 90 jours max)
```

**Promesse utilisateur** : *"Vos données ne quittent jamais votre poste de travail. Aucune information ne transite par les serveurs Gr33t."*

**Argument commercial** : Différenciateur fort face aux outils SaaS de bien-être au travail qui collectent les données sur leurs serveurs. Auditable par le service IT via les logs réseau.

**Contraintes** :
- Pas de dashboard collectif
- Pas de tendances long terme au-delà de 90 jours
- Pas de comparaisons entre collaborateurs
- Historique perdu en cas de réinstallation si les roamingSettings ne sont pas préservés

**Modèle économique** : Freemium ou licence individuelle, déploiement en self-service par le client.

---

### 2.2 Gr33t Premium — Client de l'API Gr33t

**Positionnement** : Le frontend Outlook de la plateforme Gr33t entreprise.

**Cible** :
- Entreprises déjà clientes Gr33t
- ETI et grands groupes avec démarche QVCT structurée
- Organisations qui ont besoin de tendances longues, de dashboards RH et de benchmarks

**Architecture** : L'add-in est un **client de l'API Gr33t**. Il n'appelle pas Microsoft Graph du tout. Les données d'activité (agenda + mails) sont déjà collectées par la plateforme Gr33t existante, dans le cadre de sécurité contractuel négocié avec le client entreprise.

**Flux de données** :

```
Collecte existante Gr33t (déjà en place, conforme entreprises)
    ↓
Backend / Plateforme Gr33t
    ↓ HTTPS
api.gr33t.fr/v1/me/recovery
    ↓
TaskPane Gr33t (simple affichage des scores reçus)
```

L'add-in ne fait que l'affichage : pas de calcul, pas d'accès aux données brutes, pas de scope Microsoft Graph sensible.

**Avantages côté déploiement** :
- Le manifest de l'add-in ne déclare **aucun scope Graph sensible**
- Pas de consentement admin M365 pour Mail/Calendar
- Déploiement trivial au même titre qu'un add-in d'intégration tierce (Salesforce, Jira)
- Toute la complexité sécurité, conformité RGPD, hébergement, registre des traitements est **déjà gérée dans le cadre contractuel Gr33t existant**

**Avantages côté valeur** :
- Historique illimité (côté plateforme Gr33t)
- Multi-sources : agrégation agenda + mails + autres canaux potentiels
- Dashboard collectif RH/management accessible depuis la plateforme web Gr33t
- Benchmarks par équipe/service/secteur
- Tendances long terme (6, 12, 24 mois)

**Modèle économique** : Inclus dans le contrat Gr33t entreprise existant, sans surcoût ou en option.

---

## 3. Tableau comparatif

| Aspect | Gr33t Solo | Gr33t Premium |
|---|---|---|
| Source de données | Microsoft Graph (direct) | API Gr33t |
| Scopes M365 | `Calendars.Read` + `Mail.ReadBasic` + `User.Read` | Aucun (hors SSO) |
| Consentement admin M365 | Oui (scopes Graph) | Non |
| Backend Gr33t | Non | Oui (existant) |
| Dashboard collectif | Non | Oui |
| Tendances au-delà 90 jours | Non | Oui |
| Historique | 90 jours local | Illimité côté plateforme |
| Multi-devices | Via roamingSettings | Natif via API |
| Multi-sources | Outlook uniquement | Agrégation Gr33t |
| Complexité de déploiement | Moyenne | Faible |
| Cible | Individus, PME, pilotes | Clients entreprise |
| Argument commercial | « Données 100% locales » | « Intégré à votre plateforme Gr33t » |

---

## 4. Permissions et API (Gr33t Solo uniquement)

La version Premium n'utilisant pas Microsoft Graph, cette section ne concerne que Gr33t Solo.

### 4.1 Scopes Microsoft Graph requis

| Scope | Usage | Sensibilité |
|---|---|---|
| `User.Read` | Identifier l'utilisateur (nom, email) | Faible |
| `Calendars.Read` | Lire les événements du calendrier + FreeBusy | Moyenne |
| `Mail.ReadBasic` | Lire les métadonnées des mails envoyés (timestamps) — **pas le contenu** | Faible |
| `offline_access` | Rafraîchir le token sans reconnexion | Standard |

**Point clé sur `Mail.ReadBasic`** : ce scope donne accès aux métadonnées (sujet, expéditeur, destinataires, horodatages, dossiers) de tous les mails de l'utilisateur, **sans le corps des messages ni les pièces jointes**. C'est le scope le plus adapté au besoin de Gr33t : on ne récupère que les `sentDateTime` pour calculer la charge de travail et le débordement.

C'est un argument commercial fort face aux DPO et RSSI : l'add-in ne peut techniquement pas lire le contenu des mails, même s'il le voulait.

### 4.2 Endpoints utilisés

```
GET /me                              → profil utilisateur
GET /me/calendar/events              → événements du calendrier
POST /me/calendar/getSchedule        → FreeBusy des participants
GET /me/mailFolders/sentItems/messages?$select=sentDateTime&$top=100
                                     → horodatages des mails envoyés
```

---

## 5. Authentification

### 5.1 Gr33t Solo

Trois options, classées de la plus simple à la plus robuste.

**Option 1 — Office.auth.getAccessToken() (privilégiée)**

L'API Office Add-in fournit directement un token SSO identifiant l'utilisateur. Ce token peut être utilisé pour appeler Graph ou échangé via un flux OBO.

```javascript
const token = await Office.auth.getAccessToken({
  allowSignInPrompt: true,
  allowConsentPrompt: true,
  forMSGraphAccess: true
});
```

- Expérience fluide : aucun popup visible
- Nécessite le consentement admin au préalable
- Fonctionne sur Outlook Web, Windows, Mac

**Option 2 — MSAL.js avec popup**

Utilisation directe de Microsoft Authentication Library. Popup au premier lancement, puis silencieux grâce au cache et au refresh token.

- Plus robuste, fonctionne dans tous les cas
- Friction UX au premier lancement
- Plus de code à maintenir

**Option 3 — Hybride (recommandée pour la production)**

Tenter `Office.auth.getAccessToken()` en premier (silencieux). En cas d'échec, tomber sur MSAL popup. Pattern recommandé par Microsoft pour les add-ins production.

### 5.2 Gr33t Premium

L'add-in s'authentifie auprès de l'**API Gr33t**, pas auprès de Graph. Deux options :

**Option A — SSO Azure AD avec Gr33t comme SP**
Si la plateforme Gr33t est configurée pour accepter Azure AD comme Identity Provider, l'expérience est totalement transparente : l'utilisateur est déjà connecté via Outlook, donc déjà authentifié auprès de Gr33t.

**Option B — Login Gr33t classique**
Au premier lancement, formulaire de login Gr33t dans une WebView du TaskPane. Token stocké dans `Office.context.roamingSettings`. Silencieux aux lancements suivants grâce au refresh token.

**Question ouverte** : le mode d'authentification dépend de l'architecture existante de la plateforme Gr33t. À valider avec l'équipe backend.

---

## 6. Déploiement

Trois acteurs, trois processus distincts.

### 6.1 Côté Microsoft (enregistrement)

**Enregistrement Azure AD (Gr33t Solo uniquement)**
- Créer une App Registration dans Azure Entra ID
- Déclarer les scopes Graph (`Calendars.Read`, `Mail.ReadBasic`, `User.Read`)
- Configurer les redirect URIs
- Obtenir le `Client ID`

**Manifest de l'add-in**
- Rédiger le manifest unifié (`manifest.json`)
- Héberger les fichiers HTML/CSS/JS sur un domaine HTTPS : Azure Static Web Apps ou `app.gr33t.fr`
- Deux manifests distincts : `manifest-solo.json` et `manifest-premium.json`

**Pas de review AppSource**
Pour un usage interne, l'add-in ne passe pas par AppSource. Pas de review Microsoft, pas de délai. Chaque admin M365 déploie directement le manifest fourni par Gr33t.

Une review AppSource serait nécessaire uniquement pour une distribution publique commerciale (Gr33t Solo en version freemium par exemple).

### 6.2 Côté entreprise (admin M365)

**Processus Gr33t Solo**
1. L'admin se connecte à `admin.microsoft.com` → Settings → Integrated apps → Upload custom apps
2. Upload du fichier `manifest-solo.json`
3. Choix des utilisateurs cibles (toute l'organisation, un groupe AAD, ou des utilisateurs individuels)
4. **Consentement administrateur** pour les scopes Graph : action cruciale qui évite que chaque utilisateur soit invité à accorder les permissions individuellement
5. Déploiement automatique en quelques minutes

**Processus Gr33t Premium**
1. Même démarche d'upload du manifest (`manifest-premium.json`)
2. **Pas de consentement Graph à donner** — simplification majeure
3. Uniquement l'autorisation d'appeler l'API externe `api.gr33t.fr`, ce qui est standard

### 6.3 Côté utilisateur final

**Zero action requise**. Une fois déployé par l'admin :
- Le bouton Gr33t apparaît dans le ruban du calendrier Outlook
- Au premier clic, le TaskPane s'ouvre
- Authentification silencieuse via SSO
- L'add-in fonctionne immédiatement

---

## 7. Architecture technique et code partagé

### 7.1 Code commun aux deux versions

- Manifest structure (à l'exception des scopes)
- Bouton ruban + ouverture du TaskPane
- Shell du TaskPane (header, week selector, timeline, facteurs, trend chart, footer)
- Composants UI Fluent Design
- Logique d'affichage et de rendu
- Logique de hover sur les facteurs → highlight timeline

### 7.2 Code spécifique Gr33t Solo

- Module `GraphDataFetcher` : appels `/me/calendar/events` et `/me/mailFolders/sentItems/messages`
- Module `ScoreCalculator` : calcul local des 4 facteurs de récupération
- Module `LocalStorage` : persistance via `roamingSettings`, expiration 90 jours
- Module `AuthGraph` : SSO Office + fallback MSAL

### 7.3 Code spécifique Gr33t Premium

- Module `Gr33tApiClient` : appels REST vers `api.gr33t.fr`
- Module `AuthGr33t` : authentification plateforme Gr33t
- **Pas de calcul local** : les scores et détails arrivent prêts à l'emploi depuis l'API

### 7.4 Stratégie de distribution : deux manifests séparés

Recommandation : **maintenir deux manifests distincts** plutôt qu'un manifest unique avec détection de mode.

**Raisons** :
- Le manifest Premium ne déclare **aucun scope Graph**, ce qui est visible et rassurant pour les admins IT des grandes entreprises
- Audit simplifié : un admin voit immédiatement ce que l'add-in peut faire ou non
- Déploiements découplés : on peut mettre à jour une version sans toucher à l'autre
- Évite les bugs liés à la détection de mode au runtime

**Build unique, deux packages** : le même codebase produit deux bundles à partir de variables d'environnement (`BUILD_TARGET=solo` ou `BUILD_TARGET=premium`).

---

## 8. Sécurité et conformité

### 8.1 Gr33t Solo

- **Données 100% locales** : aucune donnée ne transite par les serveurs Gr33t
- **Stockage** : `Office.context.roamingSettings` (chiffré par Microsoft, synchronisé sur les devices de l'utilisateur)
- **Durée de conservation** : 90 jours glissants, purge automatique
- **Tokens OAuth** : en mémoire uniquement, jamais persistés
- **Pas de backend Gr33t** : pas de traitement de données personnelles côté éditeur, simplifie drastiquement les obligations RGPD
- **Argument audit** : l'admin IT peut vérifier via les logs réseau que l'add-in n'émet aucune requête vers `gr33t.fr`

### 8.2 Gr33t Premium

- **Toute la conformité est gérée par la plateforme Gr33t existante**, dans le cadre contractuel négocié avec chaque client entreprise
- L'add-in ne fait qu'afficher des données déjà collectées, stockées et gérées selon les engagements Gr33t
- Aucun ajout de complexité RGPD par rapport à l'existant
- Information CSE, AIPD, registre des traitements : déjà traités au niveau de la plateforme

---

## 9. Questions ouvertes à trancher

### 9.1 API Gr33t
- L'API Gr33t expose-t-elle déjà les endpoints nécessaires pour alimenter la vue journalière de l'add-in (score du jour, 4 facteurs détaillés, timeline des événements) ?
- Si non, quel effort backend pour les ajouter ?

### 9.2 Identité et authentification Premium
- Quelle clé de réconciliation entre l'utilisateur Outlook (email M365) et l'utilisateur Gr33t (compte plateforme) ?
- Un SSO Azure AD tenant-to-tenant est-il déjà en place avec les clients Gr33t existants ?

### 9.3 Premier lancement Premium
- Si un utilisateur ouvre l'add-in Premium mais n'a pas de compte Gr33t actif dans l'organisation : message explicatif, redirection commerciale, mode dégradé ?

### 9.4 Coexistence des versions
- Un utilisateur peut-il avoir Solo à titre personnel et Premium via son entreprise simultanément ?
- Si non, comment gérer la migration et éviter les conflits de manifest ?

### 9.5 Hébergement du manifest Solo
- Azure Static Web Apps (écosystème Microsoft, intégration naturelle) ?
- `app.gr33t.fr` (contrôle complet côté Gr33t) ?

### 9.6 Support Outlook Mobile
- L'API Office.js sur mobile est plus limitée : faut-il viser le mobile en V1 ou se concentrer sur Web + Desktop ?

---

## 10. Roadmap indicative

### Phase 1 — Gr33t Solo (MVP)
**Objectif** : Mettre en place la version autonome, valider le concept, construire une base d'utilisateurs.

- Setup projet + manifest + hébergement
- Authentification Office.auth + fallback MSAL
- Appels Graph : calendrier + mails envoyés
- Calcul des 4 facteurs en local
- TaskPane Fluent Design (déjà maquetté)
- Stockage roamingSettings + expiration 90j
- Tests sur Outlook Web, Windows, Mac
- Déploiement pilote sur un tenant de test

**Estimation** : 5 à 7 jours selon SPEC.md

### Phase 2 — Gr33t Premium
**Objectif** : Transformer l'add-in en frontend de la plateforme Gr33t pour les clients entreprise.

- Cadrage API Gr33t (endpoints, contrats, auth)
- Module `Gr33tApiClient` et `AuthGr33t`
- Adaptation du TaskPane pour consommer l'API
- Manifest Premium dédié (sans scopes Graph)
- Build matrix Solo/Premium
- Déploiement pilote chez un client Gr33t existant

**Dépendances** : disponibilité des endpoints côté plateforme Gr33t

### Phase 3 — Extensions
- Alertes de transition dans le volet de création d'événement (F2 du SPEC)
- Courbe de tendance enrichie
- Notifications proactives
- Intégration avec d'autres outils M365 (Teams, Viva)

---

## 11. Synthèse décisionnelle

| Décision | Choix retenu |
|---|---|
| Deux versions | Oui : Solo (autonome) + Premium (client API) |
| Source de données Solo | Microsoft Graph direct |
| Source de données Premium | API Gr33t existante |
| Scope mail Solo | `Mail.ReadBasic` (métadonnées uniquement) |
| Backend Gr33t nécessaire | Non pour Solo, oui pour Premium (déjà existant) |
| Manifest | Deux manifests séparés (`solo` et `premium`) |
| Auth Solo | `Office.auth.getAccessToken` + fallback MSAL |
| Auth Premium | À valider avec l'équipe backend Gr33t |
| Déploiement | M365 Admin Center (pas d'AppSource pour l'usage interne) |
| Stockage Solo | `roamingSettings`, 90 jours |
| Priorité de développement | Solo d'abord, Premium ensuite |
