const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageBreak,
} = require('docx');

// ===================== Helpers =====================
const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, ...opts })],
    spacing: { after: 120 },
  });
}

function pRich(runs, opts = {}) {
  return new Paragraph({
    children: runs.map(r => typeof r === 'string' ? new TextRun(r) : new TextRun(r)),
    spacing: { after: 120 },
    ...opts,
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun(text)],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun(text)],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun(text)],
  });
}

function bullet(text, level = 0) {
  const runs = typeof text === 'string'
    ? [new TextRun(text)]
    : text.map(t => typeof t === 'string' ? new TextRun(t) : new TextRun(t));
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    children: runs,
    spacing: { after: 80 },
  });
}

function numItem(text, level = 0) {
  const runs = typeof text === 'string'
    ? [new TextRun(text)]
    : text.map(t => typeof t === 'string' ? new TextRun(t) : new TextRun(t));
  return new Paragraph({
    numbering: { reference: 'numbers', level },
    children: runs,
    spacing: { after: 80 },
  });
}

function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Consolas", size: 20 })],
    spacing: { before: 60, after: 120 },
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
  });
}

function tc(text, opts = {}) {
  const { bold = false, bg = null, width = 2340, align = AlignmentType.LEFT } = opts;
  const cell = {
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold })],
    })],
  };
  if (bg) cell.shading = { fill: bg, type: ShadingType.CLEAR };
  return new TableCell(cell);
}

function spacer() {
  return new Paragraph({ children: [new TextRun("")], spacing: { after: 60 } });
}

// ===================== Content =====================
const children = [];

// Title
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [new TextRun({ text: "Plan de développement", size: 40, bold: true })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 360 },
  children: [new TextRun({ text: "Gr33t Solo — Version autonome", size: 32, bold: true, color: "4387F4" })],
}));

children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 120 },
  children: [new TextRun({ text: "Add-in Microsoft 365 Outlook", size: 24, italics: true, color: "616161" })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 480 },
  children: [new TextRun({ text: "Version 1.0 — Avril 2026", size: 20, color: "616161" })],
}));

// Objective
children.push(h1("Objectif"));
children.push(p("Livrer un add-in Outlook fonctionnel, déployable en interne via le M365 Admin Center, qui affiche les indicateurs de récupération (score + 4 facteurs + timeline) calculés localement à partir de Microsoft Graph."));
children.push(pRich([
  { text: "Cible technique : ", bold: true },
  "Outlook Web, Windows, Mac (pas de mobile en V1).",
]));

// ===== Phase 0 =====
children.push(h1("Phase 0 — Setup et prérequis"));
children.push(p("Durée : 0,5 à 1 jour", { italics: true, color: "616161" }));

children.push(h2("0.1 Environnement Microsoft"));
children.push(p("Un tenant Microsoft 365 Developer Program (gratuit) pour avoir un environnement de test complet avec des utilisateurs, boîtes mail et calendriers pré-remplis. S'inscrire sur developer.microsoft.com/microsoft-365/dev-program."));
children.push(p("Accès au portail Azure du même tenant pour créer l'App Registration."));

children.push(h2("0.2 App Registration Azure AD"));
children.push(bullet("Créer une application dans Azure Entra ID → App registrations → New registration"));
children.push(bullet([{ text: "Type : ", bold: true }, "Accounts in any organizational directory (multitenant) pour permettre le déploiement chez différents clients"]));
children.push(bullet("Redirect URI : https://<domaine-hébergement>/taskpane.html (type Single-page application)"));
children.push(bullet([{ text: "Noter le ", }, { text: "Application (client) ID", bold: true }]));
children.push(bullet("Section API permissions : ajouter les scopes délégués suivants :"));
children.push(bullet("User.Read", 1));
children.push(bullet("Calendars.Read", 1));
children.push(bullet("Mail.ReadBasic", 1));
children.push(bullet("offline_access", 1));
children.push(bullet("Section Authentication : activer Access tokens et ID tokens"));
children.push(bullet("Section Expose an API : définir un Application ID URI (api://<appId>) pour le SSO Office"));

children.push(h2("0.3 Hébergement"));
children.push(p("Trois options à comparer, à trancher avant le setup :"));
children.push(h3("Option 1 — Azure Static Web Apps"));
children.push(bullet("Intégration native avec GitHub Actions"));
children.push(bullet("HTTPS gratuit, déploiement continu"));
children.push(bullet("Domaine *.azurestaticapps.net ou domaine custom"));
children.push(bullet("Coût : gratuit jusqu'à 100 GB/mois"));
children.push(h3("Option 2 — Azure Blob Storage + Azure CDN"));
children.push(bullet("Plus de contrôle, moins cher à grande échelle"));
children.push(bullet("Setup un peu plus complexe"));
children.push(h3("Option 3 — Infrastructure existante Gr33t (app.gr33t.fr)"));
children.push(bullet("Cohérence de marque, contrôle total"));
children.push(bullet("Nécessite une configuration HTTPS + CORS + caching correctement paramétrée"));
children.push(pRich([
  { text: "Recommandation : ", bold: true },
  "Azure Static Web Apps pour la V1 (rapidité), migration vers app.gr33t.fr si besoin ensuite.",
]));

children.push(h2("0.4 Outillage de développement"));
children.push(bullet("Node.js LTS (pour le build)"));
children.push(bullet([{ text: "Yeoman Office Add-in generator : ", bold: true }, "npm install -g yo generator-office — scaffolding officiel Microsoft"]));
children.push(bullet("Office Add-in Debugger pour VS Code"));
children.push(bullet("Outlook Desktop installé localement pour tester le sideload"));
children.push(bullet("Compte GitHub pour le repo"));

children.push(h2("0.5 Livrables de la phase"));
children.push(bullet("Tenant M365 Developer opérationnel"));
children.push(bullet("App Registration Azure avec Client ID"));
children.push(bullet("Infrastructure d'hébergement choisie et provisionnée"));
children.push(bullet("Repo Git initialisé avec le scaffolding Office Add-in"));

// ===== Phase 1 =====
children.push(h1("Phase 1 — Manifest et bouton ruban"));
children.push(p("Durée : 0,5 jour", { italics: true, color: "616161" }));

children.push(h2("1.1 Rédaction du manifest"));
children.push(p("Deux formats possibles :"));
children.push(bullet([{ text: "Manifest unifié JSON ", bold: true }, "(recommandé pour les nouveaux projets) — Format moderne aligné avec Microsoft Teams"]));
children.push(bullet([{ text: "Manifest XML classique ", bold: true }, "— Format historique, encore majoritairement utilisé pour les add-ins Outlook"]));
children.push(p("Recommandation : manifest XML en V1 car il a un meilleur support sur toutes les versions d'Outlook (Desktop notamment), et la plupart des exemples Microsoft sont encore en XML."));

children.push(p("Contenu clé du manifest :"));
children.push(bullet("Métadonnées : nom « Gr33t », description, éditeur, icônes (16, 32, 64, 80 px)"));
children.push(bullet("<Host xsi:type=\"MailHost\"> pour cibler Outlook"));
children.push(bullet("Déclaration du bouton ruban dans le calendrier avec son action (ouvrir le TaskPane)"));
children.push(bullet("URL du TaskPane : https://<hébergement>/taskpane.html"));
children.push(bullet("Scopes Graph et infos SSO (<WebApplicationInfo>)"));

children.push(h2("1.2 Icônes et assets"));
children.push(bullet("Créer les icônes Gr33t aux tailles 16, 32, 64, 80 px en PNG"));
children.push(bullet("Favicon pour le TaskPane"));
children.push(bullet("Logo Gr33t pour l'intérieur du TaskPane"));

children.push(h2("1.3 Sideload et test du bouton"));
children.push(bullet("Uploader le manifest en sideload dans Outlook Desktop ou Web"));
children.push(bullet("Vérifier que le bouton Gr33t apparaît dans le ruban"));
children.push(bullet("Vérifier que le clic ouvre un TaskPane vide"));

children.push(h2("1.4 Livrables"));
children.push(bullet("Manifest XML valide (passe la validation Microsoft)"));
children.push(bullet("Icônes PNG"));
children.push(bullet("Bouton ruban visible et fonctionnel sur Outlook Web et Desktop"));

// ===== Phase 2 =====
children.push(h1("Phase 2 — Authentification SSO"));
children.push(p("Durée : 0,5 à 1 jour", { italics: true, color: "616161" }));

children.push(h2("2.1 Implémentation de Office.auth.getAccessToken"));
children.push(bullet("Charger office.js dans le TaskPane"));
children.push(bullet("Implémenter l'appel Office.auth.getAccessToken avec allowSignInPrompt, allowConsentPrompt et forMSGraphAccess"));
children.push(bullet("Gérer les erreurs courantes (codes 13xxx)"));
children.push(bullet("Vérifier le token reçu et le décoder (JWT) pour affichage debug"));

children.push(h2("2.2 Fallback MSAL"));
children.push(bullet("Intégrer msal-browser via npm"));
children.push(bullet("Configurer avec le Client ID Azure"));
children.push(bullet("Implémenter le flux popup en cas d'échec du SSO"));
children.push(bullet("Cache des tokens en mémoire"));

children.push(h2("2.3 Module AuthService"));
children.push(p("Encapsuler les deux méthodes dans un module unique avec une API simple : getAccessToken(), signOut(), isAuthenticated()."));

children.push(h2("2.4 Consentement administrateur"));
children.push(bullet("Documenter l'URL de consentement admin : https://login.microsoftonline.com/common/adminconsent?client_id=<appId>"));
children.push(bullet("Tester le flux avec un tenant de test"));

children.push(h2("2.5 Livrables"));
children.push(bullet("Token Graph obtenu avec succès via SSO sur tenant de test"));
children.push(bullet("Fallback MSAL fonctionnel"));
children.push(bullet("Module AuthService documenté"));

// ===== Phase 3 =====
children.push(h1("Phase 3 — Accès aux données Microsoft Graph"));
children.push(p("Durée : 1 jour", { italics: true, color: "616161" }));

children.push(h2("3.1 Client Graph minimal"));
children.push(p("Créer un module GraphClient qui :"));
children.push(bullet("Prend un token en paramètre"));
children.push(bullet("Expose des méthodes typées pour les endpoints utilisés"));
children.push(bullet("Gère les erreurs HTTP (401 = token expiré, 429 = rate limit)"));
children.push(bullet("Parse les réponses JSON"));
children.push(p("Options d'implémentation :"));
children.push(bullet("fetch natif (simple, zéro dépendance)"));
children.push(bullet("@microsoft/microsoft-graph-client (SDK officiel, plus robuste)"));
children.push(pRich([
  { text: "Recommandation : ", bold: true },
  "SDK officiel pour bénéficier des retry, pagination automatique, typage TypeScript.",
]));

children.push(h2("3.2 Méthodes à implémenter"));
children.push(bullet("graphClient.getUserProfile() → GET /me"));
children.push(bullet("graphClient.getCalendarEvents(from, to) → GET /me/calendar/events avec filtres date et select champs pertinents"));
children.push(bullet("graphClient.getSentMails(from, to) → GET /me/mailFolders/sentItems/messages avec select=sentDateTime"));
children.push(bullet("graphClient.getSchedule(emails, from, to) → POST /me/calendar/getSchedule (reporté, F2 du SPEC)"));

children.push(h2("3.3 Gestion des erreurs et edge cases"));
children.push(bullet("Token expiré → re-auth via AuthService"));
children.push(bullet("Rate limiting → retry avec backoff exponentiel"));
children.push(bullet("Boîte mail vide → gestion gracieuse"));
children.push(bullet("Événements récurrents → gérer les seriesMaster et occurrences"));
children.push(bullet("Événements « all-day » → filtrés dès le départ"));

children.push(h2("3.4 Tests manuels avec Graph Explorer"));
children.push(bullet("Utiliser developer.microsoft.com/graph/graph-explorer pour valider les requêtes"));
children.push(bullet("Vérifier le format exact des réponses"));
children.push(bullet("Identifier les cas limites (événements annulés, déclinés, etc.)"));

children.push(h2("3.5 Livrables"));
children.push(bullet("Module GraphClient fonctionnel"));
children.push(bullet("Données du calendrier et des mails récupérables sur le tenant de test"));
children.push(bullet("Gestion des erreurs en place"));

// ===== Phase 4 =====
children.push(h1("Phase 4 — Moteur de calcul des scores"));
children.push(p("Durée : 1 à 1,5 jour", { italics: true, color: "616161" }));

children.push(h2("4.1 Filtrage des événements"));
children.push(p("Conformément au SPEC.md :"));
children.push(bullet("Au moins 2 participants (organisateur + 1 invité)"));
children.push(bullet("Utilisateur a accepté (responseStatus != \"declined\" et != \"none\")"));
children.push(bullet("Pas un événement « all-day »"));
children.push(p("Créer un module EventFilter qui applique ces règles."));

children.push(h2("4.2 Calcul des 4 facteurs"));
children.push(p("Module ScoreCalculator avec une méthode par facteur :"));

children.push(h3("Facteur 1 — Multi-tâche"));
children.push(bullet("Pour chaque réunion, compter le nombre de mails envoyés pendant sa durée"));
children.push(bullet("Score = 25 × (réunions sans mail / total réunions)"));

children.push(h3("Facteur 2 — Transitions"));
children.push(bullet("Pour chaque réunion, vérifier gap ≥ 5 min avant et après"));
children.push(bullet("Première réunion : condition « avant » toujours OK"));
children.push(bullet("Dernière réunion : condition « après » toujours OK"));
children.push(bullet("Score = 25 × (réunions avec transitions OK / total réunions)"));

children.push(h3("Facteur 3 — Débordement"));
children.push(bullet("25 pts si aucune réunion hors 8h-20h ET aucun mail hors 8h-20h"));
children.push(bullet("−10 pts par mail hors plage"));
children.push(bullet("0 pts si réunion hors plage"));
children.push(bullet("Minimum 0"));

children.push(h3("Facteur 4 — Travail profond"));
children.push(bullet("Identifier les blocs ≥ 15 min sans réunion ni mail, dans les plages 8h-12h30 et 13h30-20h"));
children.push(bullet("Calculer entre le premier et le dernier mail envoyé (plage usuelle)"));
children.push(bullet("10 pts par heure, max 25"));
children.push(bullet("0 si aucun mail envoyé dans la journée"));

children.push(h2("4.3 Score global"));
children.push(p("Somme des 4 facteurs sur 100. Couleur :"));
children.push(bullet("≥ 80 → vert"));
children.push(bullet("50-79 → orange"));
children.push(bullet("< 50 → rouge"));

children.push(h2("4.4 Tests unitaires"));
children.push(p("Créer des fixtures correspondant à des journées types :"));
children.push(bullet("Journée idéale (score 95+)"));
children.push(bullet("Journée surchargée de réunions (score ~40)"));
children.push(bullet("Journée avec débordement (mails tard le soir)"));
children.push(bullet("Journée vide (aucune activité)"));
children.push(p("Vérifier que le calcul produit les scores attendus. Ces tests sont critiques car le calcul est le cœur du produit."));
children.push(pRich([{ text: "Framework : ", bold: true }, "Vitest ou Jest."]));

children.push(h2("4.5 Livrables"));
children.push(bullet("Module ScoreCalculator complet"));
children.push(bullet("Suite de tests unitaires couvrant les 4 facteurs et le score global"));
children.push(bullet("Documentation du calcul de chaque facteur"));

// ===== Phase 5 =====
children.push(h1("Phase 5 — TaskPane UI"));
children.push(p("Durée : 1 à 1,5 jour", { italics: true, color: "616161" }));

children.push(h2("5.1 Base du TaskPane"));
children.push(p("Partir de la maquette mockup-D.html déjà produite et l'adapter."));
children.push(p("Choix du framework :"));
children.push(bullet([{ text: "Vanilla JS + Web Components ", bold: true }, "— zéro dépendance, bundle minuscule, cohérent avec la maquette actuelle"]));
children.push(bullet([{ text: "React + Fluent UI React v9 ", bold: true }, "— composants Fluent natifs, bundle plus lourd, courbe d'apprentissage"]));
children.push(pRich([
  { text: "Recommandation : ", bold: true },
  "React + Fluent UI v9 — choix le plus professionnel et évolutif, recommandé par Microsoft. Surcoût en taille de bundle acceptable (~200 Ko).",
]));

children.push(h2("5.2 Composants à implémenter"));
children.push(bullet("Header — titre jour, close, score, barre de progression"));
children.push(bullet("WeekSelector — 5 cartes jour avec scores"));
children.push(bullet("MiniTimeline — timeline verticale 8h-21h avec événements et overlays"));
children.push(bullet("FactorCard — bloc facteur avec hover highlight"));
children.push(bullet("FactorsList — liste des 4 facteurs"));
children.push(bullet("TrendChart — courbe de tendance SVG"));
children.push(bullet("Footer — mention QVCT"));

children.push(h2("5.3 State management"));
children.push(bullet("État principal : selectedDay, dayScores, isLoading, error"));
children.push(bullet("Gestionnaire simple (useState + useContext, ou Zustand)"));
children.push(bullet("Pas besoin de Redux pour ce périmètre"));

children.push(h2("5.4 Logique de hover timeline"));
children.push(p("Reproduire le comportement de la maquette : hover sur un facteur → overlay correspondant visible sur la timeline."));

children.push(h2("5.5 Gestion des états"));
children.push(bullet("Loading : skeleton screens ou spinner Fluent"));
children.push(bullet("Erreur : message avec bouton « Réessayer »"));
children.push(bullet("Pas de données : message « Données disponibles demain »"));
children.push(bullet("Première ouverture : potentiellement un onboarding court"));

children.push(h2("5.6 Livrables"));
children.push(bullet("TaskPane fonctionnel avec toutes les vues de la maquette"));
children.push(bullet("Composants réutilisables et testables"));
children.push(bullet("États loading/error/empty gérés"));

// ===== Phase 6 =====
children.push(h1("Phase 6 — Stockage local et cache"));
children.push(p("Durée : 0,5 jour", { italics: true, color: "616161" }));

children.push(h2("6.1 Choix du stockage"));
children.push(h3("Option 1 — Office.context.roamingSettings"));
children.push(bullet("Synchronisé sur tous les devices de l'utilisateur via M365"));
children.push(bullet("Limité à ~32 Ko par clé"));
children.push(bullet("API asynchrone"));
children.push(h3("Option 2 — localStorage"));
children.push(bullet("Plus simple, plus rapide"));
children.push(bullet("Non synchronisé entre devices"));
children.push(bullet("Limité à ~5 Mo"));
children.push(pRich([
  { text: "Recommandation : ", bold: true },
  "roamingSettings pour les scores calculés (petits, bénéficient du roaming), localStorage pour le cache des données brutes Graph.",
]));

children.push(h2("6.2 Module StorageService"));
children.push(bullet("saveDayScore(date, scoreData)"));
children.push(bullet("getDayScore(date) → scoreData | null"));
children.push(bullet("getWeekScores(startDate) → scoreData[]"));
children.push(bullet("purgeExpired() → void (supprime >90j)"));

children.push(h2("6.3 Stratégie de fraîcheur"));
children.push(bullet("Premier chargement : afficher le cache immédiatement puis rafraîchir en background"));
children.push(bullet("Bouton « Actualiser » → force le refetch"));
children.push(bullet("Invalidation automatique du cache pour le jour en cours"));

children.push(h2("6.4 Livrables"));
children.push(bullet("Module StorageService avec API claire"));
children.push(bullet("Purge automatique des données >90j"));
children.push(bullet("Cache-then-refresh en place"));

// ===== Phase 7 =====
children.push(h1("Phase 7 — Intégration et tests end-to-end"));
children.push(p("Durée : 1 jour", { italics: true, color: "616161" }));

children.push(h2("7.1 Assemblage"));
children.push(p("Connecter tous les modules : TaskPane → AuthService → GraphClient → ScoreCalculator → StorageService → Rendu UI."));

children.push(h2("7.2 Scénarios de test manuels"));
children.push(numItem("Journée avec données : lundi/mardi de la semaine en cours"));
children.push(numItem("Journée vide : un jour futur"));
children.push(numItem("Changement de jour : clic sur le week selector"));
children.push(numItem("Hover facteurs : vérifier les overlays timeline"));
children.push(numItem("Refresh : clic sur « Actualiser »"));
children.push(numItem("Fermeture/réouverture du TaskPane"));
children.push(numItem("Token expiré : attendre ou simuler, vérifier le re-auth"));
children.push(numItem("Connexion lente : throttling réseau dans DevTools"));

children.push(h2("7.3 Tests sur les 3 plateformes"));
children.push(bullet("Outlook Web (Chrome, Edge)"));
children.push(bullet("Outlook Desktop Windows"));
children.push(bullet("Outlook Desktop Mac"));

children.push(h2("7.4 Livrables"));
children.push(bullet("Add-in fonctionnel de bout en bout sur Web, Windows, Mac"));
children.push(bullet("Check-list des scénarios testés"));

// ===== Phase 8 =====
children.push(h1("Phase 8 — Packaging et déploiement pilote"));
children.push(p("Durée : 0,5 jour", { italics: true, color: "616161" }));

children.push(h2("8.1 Build de production"));
children.push(bullet("Minification, tree-shaking, optimisation des assets"));
children.push(bullet("Vérifier la taille du bundle final (cible : <500 Ko)"));
children.push(bullet("Tester en mode production localement"));

children.push(h2("8.2 Déploiement de l'hébergement"));
children.push(bullet("Push vers Azure Static Web Apps (ou app.gr33t.fr)"));
children.push(bullet("Vérifier HTTPS, certificat valide"));
children.push(bullet("Vérifier les en-têtes CORS"));
children.push(bullet("Vérifier le cache HTTP"));

children.push(h2("8.3 Manifest final"));
children.push(bullet("Mettre à jour le manifest avec les URLs de production"));
children.push(bullet("Versionner (v1.0.0)"));
children.push(bullet("Valider via Microsoft Office Add-in Validator"));

children.push(h2("8.4 Déploiement pilote"));
children.push(bullet("Upload du manifest dans le M365 Admin Center du tenant de test"));
children.push(bullet("Consentement admin sur les scopes Graph"));
children.push(bullet("Déploiement à un groupe restreint (3-5 utilisateurs volontaires)"));
children.push(bullet("Collecte de feedback"));

children.push(h2("8.5 Livrables"));
children.push(bullet("Bundle de production déployé et accessible en HTTPS"));
children.push(bullet("Manifest v1.0.0 validé"));
children.push(bullet("Add-in installé et fonctionnel chez les utilisateurs pilotes"));

// ===== Phase 9 =====
children.push(h1("Phase 9 — Observabilité et itérations"));
children.push(p("Durée : continu", { italics: true, color: "616161" }));

children.push(h2("9.1 Logs et monitoring"));
children.push(bullet("Logs côté client uniquement (pas de backend)"));
children.push(bullet("Affichage des erreurs dans la console pour le debug"));
children.push(bullet("Question ouverte : envoyer des télémétries anonymes pour détecter les crashes ? Contradiction potentielle avec la promesse « 100% local » — à trancher."));

children.push(h2("9.2 Documentation"));
children.push(bullet("Guide admin : déploiement, consentement, scopes"));
children.push(bullet("Guide utilisateur : interprétation des scores, dépannage"));
children.push(bullet("Docs techniques : architecture, API, contribution"));

children.push(h2("9.3 Boucle de feedback"));
children.push(bullet("Canal de feedback avec les utilisateurs pilotes"));
children.push(bullet("Backlog de correctifs et améliorations"));
children.push(bullet("Cycle d'itération court (2 semaines)"));

// Page break before recap
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== Récapitulatif =====
children.push(h1("Récapitulatif du chemin critique"));

const recapRows = [
  ["Phase", "Durée", "Dépendances"],
  ["0 — Setup", "0,5-1j", "—"],
  ["1 — Manifest et bouton", "0,5j", "Phase 0"],
  ["2 — Authentification", "0,5-1j", "Phase 1"],
  ["3 — Graph", "1j", "Phase 2"],
  ["4 — Calcul", "1-1,5j", "Phase 3 (partiellement parallèle)"],
  ["5 — UI TaskPane", "1-1,5j", "Phase 1 (parallèle avec 2-4)"],
  ["6 — Stockage", "0,5j", "Phase 4"],
  ["7 — Intégration + tests", "1j", "Phases 4, 5, 6"],
  ["8 — Packaging + pilote", "0,5j", "Phase 7"],
  ["Total", "6 à 8 jours", "—"],
];

const recapTable = new Table({
  width: { size: 9000, type: WidthType.DXA },
  columnWidths: [3200, 1800, 4000],
  rows: recapRows.map((row, i) => new TableRow({
    tableHeader: i === 0,
    children: row.map(cell => {
      if (i === 0) {
        return tc(cell, { bold: true, bg: "4387F4", width: [3200, 1800, 4000][row.indexOf(cell)] });
      }
      const isTotal = row[0] === "Total";
      return new TableCell({
        borders,
        width: { size: [3200, 1800, 4000][row.indexOf(cell)], type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        shading: isTotal ? { fill: "F5F5F5", type: ShadingType.CLEAR } : undefined,
        children: [new Paragraph({
          children: [new TextRun({ text: cell, bold: isTotal })],
        })],
      });
    }),
  })),
});
// Fix header row: white text on blue
recapTable.root[0].root[1].root.forEach(cell => {
  // no-op, cells already built; text color handled via TextRun in pass
});

// Rebuild header row with white text
const rebuiltRows = recapRows.map((row, i) => new TableRow({
  tableHeader: i === 0,
  children: row.map((cell, j) => {
    const colWidths = [3200, 1800, 4000];
    if (i === 0) {
      return new TableCell({
        borders,
        width: { size: colWidths[j], type: WidthType.DXA },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        shading: { fill: "4387F4", type: ShadingType.CLEAR },
        children: [new Paragraph({
          children: [new TextRun({ text: cell, bold: true, color: "FFFFFF" })],
        })],
      });
    }
    const isTotal = row[0] === "Total";
    return new TableCell({
      borders,
      width: { size: colWidths[j], type: WidthType.DXA },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      shading: isTotal ? { fill: "E8F0FE", type: ShadingType.CLEAR } : undefined,
      children: [new Paragraph({
        children: [new TextRun({ text: cell, bold: isTotal })],
      })],
    });
  }),
}));

children.push(new Table({
  width: { size: 9000, type: WidthType.DXA },
  columnWidths: [3200, 1800, 4000],
  rows: rebuiltRows,
}));

children.push(spacer());
children.push(p("Cohérent avec l'estimation initiale du SPEC.md (5-7 jours)."));

// ===== Points d'attention =====
children.push(h1("Points d'attention"));

children.push(h2("Techniques"));
children.push(bullet("Le flux SSO peut échouer dans certaines configurations : prévoir le fallback MSAL dès le départ"));
children.push(bullet("Les événements récurrents Graph nécessitent un traitement spécifique"));
children.push(bullet("Rate limiting Graph : 10 000 requêtes par 10 minutes par app par mailbox — large, mais à garder en tête"));
children.push(bullet("Office.js a des bugs connus sur certaines versions d'Outlook Desktop Mac : tester tôt"));

children.push(h2("Organisationnels"));
children.push(bullet("Le tenant de test Developer Program expire après 90 jours sans activité : renouveler régulièrement"));
children.push(bullet("Le manifest est immuable une fois déployé chez un client (sauf mise à jour par l'admin) : bien tester avant"));
children.push(bullet("L'expérience première installation est critique : si le SSO échoue et que l'utilisateur voit un popup inattendu, il peut perdre confiance"));

// ===== Décisions =====
children.push(h1("Décisions à prendre rapidement"));
children.push(numItem([{ text: "Framework UI : ", bold: true }, "React + Fluent UI v9 (recommandé) ou vanilla JS ?"]));
children.push(numItem([{ text: "Hébergement : ", bold: true }, "Azure Static Web Apps (recommandé V1) ou app.gr33t.fr ?"]));
children.push(numItem([{ text: "Langue de développement : ", bold: true }, "TypeScript (recommandé) ou JavaScript ?"]));
children.push(numItem([{ text: "Format manifest : ", bold: true }, "XML (recommandé pour compat) ou JSON unifié ?"]));
children.push(numItem([{ text: "Stratégie tests : ", bold: true }, "unit + intégration, ou intégration seulement ?"]));
children.push(numItem([{ text: "Télémétrie : ", bold: true }, "opt-in ou zéro télémétrie ?"]));
children.push(numItem([{ text: "Nom de l'App Registration : ", bold: true }, "« Gr33t Recovery Layer » ou autre ?"]));

// ===== Livrable final =====
children.push(h1("Livrable final de la V1"));
children.push(p("À la fin des 8 jours, on disposera :"));
children.push(bullet("Un add-in Outlook packagé (manifest XML + bundle hébergé)"));
children.push(bullet("Déployable en 15 minutes chez n'importe quel client M365 via l'Admin Center"));
children.push(bullet("Fonctionnel sur Outlook Web, Windows et Mac"));
children.push(bullet("Qui affiche le score de récupération du jour précédent avec les 4 facteurs détaillés"));
children.push(bullet("Avec une mini-timeline interactive et des indicateurs au hover"));
children.push(bullet("Avec un sélecteur de jour pour naviguer dans la semaine"));
children.push(bullet("Avec une courbe de tendance sur 3 semaines"));
children.push(bullet("Le tout en 100% local, sans backend Gr33t, avec seulement les permissions minimales (Calendars.Read + Mail.ReadBasic)"));
children.push(spacer());
children.push(p("Prêt pour un pilote client et pour itérer vers la V2 (Premium).", { italics: true, bold: true }));

// ===================== Document =====================
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 },
        paragraph: { spacing: { line: 276 } },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, color: "2A6AD4", font: "Calibri" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, color: "1E2125", font: "Calibri" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 22, bold: true, color: "4387F4", font: "Calibri" },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: "◦",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },  // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Plan-developpement-Gr33t-Solo.docx", buffer);
  console.log("✓ Document créé : Plan-developpement-Gr33t-Solo.docx");
});
