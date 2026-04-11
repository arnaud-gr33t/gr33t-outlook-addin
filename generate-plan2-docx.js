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

function pRich(runs) {
  return new Paragraph({
    children: runs.map(r => new TextRun(r)),
    spacing: { after: 120 },
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
    : text.map(t => new TextRun(t));
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    children: runs,
    spacing: { after: 80 },
  });
}

function numItem(text, level = 0) {
  const runs = typeof text === 'string'
    ? [new TextRun(text)]
    : text.map(t => new TextRun(t));
  return new Paragraph({
    numbering: { reference: 'numbers', level },
    children: runs,
    spacing: { after: 80 },
  });
}

function spacer() {
  return new Paragraph({ children: [new TextRun("")], spacing: { after: 60 } });
}

function callout(text, color = "4387F4") {
  return new Paragraph({
    children: [new TextRun({ text, italics: true })],
    spacing: { before: 120, after: 120 },
    shading: { fill: "F0F6FF", type: ShadingType.CLEAR },
    border: {
      left: { style: BorderStyle.SINGLE, size: 24, color },
    },
    indent: { left: 240 },
  });
}

// ===================== Content =====================
const children = [];

// Title page
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [new TextRun({ text: "Plan de développement n° 2", size: 40, bold: true })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [new TextRun({ text: "Gr33t Solo — Approche UI-first", size: 32, bold: true, color: "4387F4" })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 120 },
  children: [new TextRun({ text: "React + Fluent UI v9", size: 24, italics: true, color: "616161" })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 480 },
  children: [new TextRun({ text: "Version 1.0 — Avril 2026", size: 20, color: "616161" })],
}));

// Strategy note
children.push(h1("Stratégie"));
children.push(p("Ce plan propose une approche UI-first : intégrer d'abord le TaskPane dans Outlook avec des données mockées, puis brancher progressivement l'authentification, l'accès aux données Microsoft Graph, et le moteur de calcul."));

children.push(h2("Pourquoi cette approche"));
children.push(bullet("Validation visuelle immédiate : le TaskPane apparaît dans le vrai Outlook en quelques heures, permettant de confronter la maquette à la réalité (taille, polices, couleurs, comportement iframe)"));
children.push(bullet("Découplage UI / données : les briques complexes (Graph, auth, calcul) peuvent attendre ; l'UI génère du feedback rapide"));
children.push(bullet("Réduction du risque : le sideload d'un add-in Outlook et ses contraintes techniques sont traités en isolation, sans bugs d'auth ou de Graph qui brouilleraient le diagnostic"));
children.push(bullet("Itération UX avant engagement technique : ajustements d'interface possibles avant d'investir dans l'infra"));
children.push(bullet("Démo client précoce : un TaskPane mocké mais visuellement abouti permet de montrer le produit sans attendre la fin du développement"));

children.push(h2("Choix techniques"));
children.push(bullet([{ text: "Framework UI : ", bold: true }, "React 18 + Fluent UI React v9 (composants Microsoft natifs, alignement Microsoft 365)"]));
children.push(bullet([{ text: "Langage : ", bold: true }, "TypeScript (typage fort, meilleur support IDE, recommandé par Microsoft pour les add-ins)"]));
children.push(bullet([{ text: "Build : ", bold: true }, "Webpack (inclus dans le scaffolding Yeoman Office)"]));
children.push(bullet([{ text: "Scaffolding : ", bold: true }, "Yeoman generator-office avec le template React + TypeScript"]));
children.push(bullet([{ text: "Tests : ", bold: true }, "Vitest (rapide, moderne, bonne intégration TypeScript)"]));

children.push(h2("Cible technique"));
children.push(p("Outlook Web, Windows, Mac. Pas de mobile en V1."));

// ===== Phase 1 =====
children.push(h1("Phase 1 — Setup minimal de l'add-in"));
children.push(p("Durée : 0,5 à 1 jour", { italics: true, color: "616161" }));
children.push(p("Objectif : installer un squelette d'add-in Outlook qui s'ouvre dans votre Outlook avec un TaskPane vide, sans authentification ni accès aux données."));

children.push(h2("1.1 Scaffolding du projet"));
children.push(bullet("Installer Node.js LTS et les outils Office : npm install -g yo generator-office"));
children.push(bullet("Générer le projet : yo office"));
children.push(bullet("Choisir : Office Add-in Task Pane project using React framework"));
children.push(bullet("Langage : TypeScript"));
children.push(bullet("Host : Outlook"));
children.push(bullet("Le scaffolding crée un projet avec webpack, dev server HTTPS, certificats auto-signés et manifest XML"));

children.push(h2("1.2 Exploration et nettoyage"));
children.push(bullet("Lancer npm start pour vérifier que le projet démarre"));
children.push(bullet("Sideload automatique dans Outlook via l'outil office-addin-debugging (fait par le script start)"));
children.push(bullet("Supprimer le contenu démo du TaskPane (composants boilerplate)"));
children.push(bullet("Garder la structure : index.html, taskpane.tsx (entry point), composants React"));

children.push(h2("1.3 Manifest minimal"));
children.push(p("Adapter le manifest XML généré pour :"));
children.push(bullet("Nom, description, éditeur : Gr33t"));
children.push(bullet("Icônes Gr33t (16, 32, 64, 80 px)"));
children.push(bullet("Cible : calendrier Outlook (pas la lecture de mail)"));
children.push(bullet("Bouton dans le ruban du calendrier avec label « Gr33t »"));
children.push(bullet("URL du TaskPane pointant vers le dev server local (https://localhost:3000)"));
children.push(bullet("Pas de scopes Graph à ce stade, pas de <WebApplicationInfo>"));

children.push(h2("1.4 Sideload dans Outlook"));
children.push(bullet("Sideload automatique via npm start (recommandé pour Outlook Desktop)"));
children.push(bullet("Alternative Outlook Web : Get Add-ins → My add-ins → Add a custom add-in → From file"));
children.push(bullet("Vérifier que le bouton apparaît dans le ruban du calendrier"));
children.push(bullet("Cliquer : un TaskPane vide (ou « Hello World ») doit s'ouvrir"));

children.push(h2("1.5 Livrables"));
children.push(bullet("Projet Office Add-in React/TypeScript opérationnel en local"));
children.push(bullet("Bouton Gr33t visible dans le ruban du calendrier Outlook"));
children.push(bullet("TaskPane qui s'ouvre et affiche un contenu minimal"));
children.push(bullet("Dev loop fonctionnel : modification du code → reload du TaskPane dans Outlook"));

// ===== Phase 2 =====
children.push(h1("Phase 2 — Intégration de la maquette avec données mockées"));
children.push(p("Durée : 1,5 à 2 jours", { italics: true, color: "616161" }));
children.push(p("Objectif : transformer mockup-D.html en TaskPane React fonctionnel, avec des données mockées, visuellement identique à la maquette."));

children.push(h2("2.1 Installation de Fluent UI v9"));
children.push(bullet("npm install @fluentui/react-components @fluentui/react-icons"));
children.push(bullet("Configurer le FluentProvider racine dans taskpane.tsx avec le thème webLightTheme"));
children.push(bullet("Vérifier que les composants Fluent s'affichent correctement dans le TaskPane"));

children.push(h2("2.2 Structure du projet"));
children.push(p("Organiser le code en modules :"));
children.push(bullet("src/taskpane/taskpane.tsx — entry point, FluentProvider"));
children.push(bullet("src/taskpane/App.tsx — composant racine"));
children.push(bullet("src/components/ — composants React (Header, WeekSelector, MiniTimeline, FactorCard, FactorsList, TrendChart, Footer)"));
children.push(bullet("src/data/mockData.ts — données mockées typées"));
children.push(bullet("src/types/ — interfaces TypeScript (DayScore, Factor, TimelineEvent, etc.)"));
children.push(bullet("src/hooks/ — hooks React custom"));
children.push(bullet("src/styles/ — styles globaux et tokens"));

children.push(h2("2.3 Types TypeScript"));
children.push(p("Définir les interfaces qui serviront de contrat entre l'UI et les données (mockées ou réelles) :"));
children.push(bullet("DayScore : date, score, scoreLabel, factors[]"));
children.push(bullet("Factor : name, summary, summaryClass, rows[], factorType"));
children.push(bullet("FactorRow : label, status, statusClass"));
children.push(bullet("TimelineEvent : start, end, name, category"));
children.push(bullet("TimelineOverlay : type, zones[]"));
children.push(bullet("WeekData : days[]"));

children.push(h2("2.4 Données mockées"));
children.push(p("Créer mockData.ts avec :"));
children.push(bullet("Une semaine complète (Lun-Ven) avec Lun et Mar remplis, Mer-Ven vides (futurs)"));
children.push(bullet("Scores, 4 facteurs détaillés par jour"));
children.push(bullet("Événements calendrier pour la timeline"));
children.push(bullet("Overlays précalculés pour les 4 facteurs (multi-tâche, transitions, débordement, travail profond)"));
children.push(bullet("Historique pour la courbe de tendance (3 semaines)"));
children.push(p("Ces données reproduisent exactement ce qui est actuellement en dur dans mockup-D.html."));

children.push(h2("2.5 Composants React"));

children.push(h3("App.tsx — Composant racine"));
children.push(bullet("Gère l'état principal : selectedDayIndex, weekData"));
children.push(bullet("Orchestre les sous-composants"));
children.push(bullet("Layout vertical : Header → WeekSelector → MiniTimeline → FactorsList → Actions → TrendChart → Footer"));

children.push(h3("Header.tsx"));
children.push(bullet("Affiche : titre du jour, bouton fermer (Dismiss icon Fluent)"));
children.push(bullet("Score en gros chiffre avec couleur sémantique (MessageBar tokens)"));
children.push(bullet("Barre de progression (Fluent ProgressBar)"));
children.push(bullet("Utilise Text avec size 400 pour le titre, size 700 pour le score"));

children.push(h3("WeekSelector.tsx"));
children.push(bullet("5 cartes Card Fluent pour Lun-Ven"));
children.push(bullet("Carte active en fond brandBackground2 avec bordure brandStroke1"));
children.push(bullet("Affichage : jour, numéro, score, mini ProgressBar"));
children.push(bullet("Callback onDayChange(index)"));

children.push(h3("MiniTimeline.tsx"));
children.push(bullet("Timeline verticale 8h-21h (rendue en CSS absolute ou SVG)"));
children.push(bullet("Graduations heure par heure"));
children.push(bullet("Zone grisée pour la pause déjeuner (12h30-13h30)"));
children.push(bullet("Événements positionnés par top/height"));
children.push(bullet("4 couches d'overlay (multi-tâche, transitions, débordement, travail profond)"));
children.push(bullet("Visibilité des overlays pilotée par une prop hoveredFactor"));

children.push(h3("FactorCard.tsx"));
children.push(bullet("Bloc facteur avec nom, résumé coloré, lignes de détail"));
children.push(bullet("Bouton « + X autres... » pour afficher plus de détails"));
children.push(bullet("Events onMouseEnter et onMouseLeave pour piloter le highlight timeline"));
children.push(bullet("Bordure gauche colorée quand survolé"));

children.push(h3("FactorsList.tsx"));
children.push(bullet("Conteneur qui map sur les 4 facteurs"));
children.push(bullet("Gère l'état hoveredFactor et le passe à MiniTimeline via App"));

children.push(h3("TrendChart.tsx"));
children.push(bullet("Courbe SVG sur 3 semaines"));
children.push(bullet("Utiliser directement SVG inline (pas besoin de librairie pour cette courbe simple)"));
children.push(bullet("Couleurs Fluent : colorBrandStroke1 pour la ligne, colorNeutralStroke2 pour la grille"));

children.push(h3("Footer.tsx"));
children.push(bullet("Mention QVCT en italique"));
children.push(bullet("Caption Fluent"));

children.push(h2("2.6 Hooks et logique"));
children.push(bullet("useSelectedDay(initial) : gère l'index du jour sélectionné"));
children.push(bullet("useFactorHover() : gère l'état de hover des facteurs"));
children.push(bullet("useMockData() : retourne les données mockées typées (plus tard remplacé par useGraphData)"));

children.push(h2("2.7 Styling"));
children.push(bullet("Utiliser makeStyles de Fluent UI pour chaque composant"));
children.push(bullet("Consommer les design tokens Fluent : colorBrandBackground, spacingHorizontalM, borderRadiusMedium, etc."));
children.push(bullet("Couleurs Gr33t conservées uniquement pour le badge du bouton ruban et le logo (identité de marque)"));
children.push(bullet("Pas de CSS global : tout encapsulé dans les composants"));

children.push(h2("2.8 Interactions à implémenter"));
children.push(bullet("Clic sur un jour dans le WeekSelector → changement de selectedDayIndex → re-render de l'App"));
children.push(bullet("Hover sur un facteur → overlay correspondant visible sur la timeline"));
children.push(bullet("Clic sur le bouton Fermer du Header → fermeture du TaskPane (via Office.context ou comportement par défaut)"));
children.push(bullet("Clic sur le bouton ruban Gr33t → (ré)ouverture du TaskPane"));
children.push(bullet("Clic sur « Actualiser les données mail » → no-op pour l'instant (affichera un toast Fluent « Données mockées »)"));

children.push(h2("2.9 Livrables"));
children.push(bullet("TaskPane React avec tous les composants de la maquette"));
children.push(bullet("Données mockées complètes dans mockData.ts"));
children.push(bullet("Interactions fonctionnelles (sélection jour, hover facteurs)"));
children.push(bullet("Visuellement fidèle à mockup-D.html"));
children.push(bullet("Prêt pour démo client"));

// ===== Phase 3 =====
children.push(h1("Phase 3 — Déploiement sur un hébergement stable"));
children.push(p("Durée : 0,5 jour", { italics: true, color: "616161" }));
children.push(p("Objectif : sortir du dev server localhost pour pouvoir installer l'add-in sur d'autres postes (collègues, prospects)."));

children.push(h2("3.1 Choix de l'hébergement"));
children.push(bullet([{ text: "Azure Static Web Apps : ", bold: true }, "recommandé pour la simplicité, HTTPS automatique, gratuit jusqu'à 100 GB/mois"]));
children.push(bullet([{ text: "Infrastructure Gr33t existante : ", bold: true }, "cohérence de marque, nécessite setup HTTPS + CORS"]));
children.push(p("Recommandation V1 : Azure Static Web Apps, migration ultérieure possible vers app.gr33t.fr."));

children.push(h2("3.2 Build de production"));
children.push(bullet("Configuration webpack mode production"));
children.push(bullet("Minification, tree-shaking"));
children.push(bullet("Vérifier la taille du bundle : Fluent UI v9 + React + TaskPane → cible <500 Ko"));

children.push(h2("3.3 Déploiement"));
children.push(bullet("Créer une ressource Azure Static Web Apps via le portail Azure"));
children.push(bullet("Configurer le déploiement depuis GitHub via Actions (CI/CD automatique)"));
children.push(bullet("Obtenir l'URL publique HTTPS"));
children.push(bullet("Mettre à jour le manifest avec les URLs de production"));

children.push(h2("3.4 Sideload avec le manifest de production"));
children.push(bullet("Tester le sideload du nouveau manifest sur Outlook Web et Desktop"));
children.push(bullet("Vérifier que tout fonctionne comme en local"));
children.push(bullet("Documenter le process de sideload pour les utilisateurs pilotes"));

children.push(h2("3.5 Livrables"));
children.push(bullet("Add-in accessible via une URL HTTPS publique"));
children.push(bullet("Manifest de production prêt à partager"));
children.push(bullet("CI/CD configurée pour déploiements futurs"));

// ===== Phase 4 =====
children.push(h1("Phase 4 — Authentification et configuration Azure"));
children.push(p("Durée : 0,5 à 1 jour", { italics: true, color: "616161" }));
children.push(p("Objectif : préparer l'infrastructure d'authentification pour pouvoir appeler Microsoft Graph à la phase suivante."));

children.push(h2("4.1 App Registration Azure AD"));
children.push(bullet("Créer une application dans Azure Entra ID (tenant de test ou Gr33t)"));
children.push(bullet("Type : Multitenant"));
children.push(bullet("Redirect URI : URL de production du TaskPane (type SPA)"));
children.push(bullet("Scopes délégués : User.Read, Calendars.Read, Mail.ReadBasic, offline_access"));
children.push(bullet("Activer Access tokens et ID tokens"));
children.push(bullet("Définir Application ID URI (api://<appId>) pour le SSO Office"));
children.push(bullet("Noter le Client ID"));

children.push(h2("4.2 Mise à jour du manifest"));
children.push(bullet("Ajouter la section <WebApplicationInfo> avec le Client ID et le resource URI"));
children.push(bullet("Déclarer les scopes Graph demandés"));

children.push(h2("4.3 Module AuthService"));
children.push(p("Créer src/services/AuthService.ts :"));
children.push(bullet("Méthode getAccessToken() qui tente Office.auth.getAccessToken en premier"));
children.push(bullet("Fallback MSAL (msal-browser) en cas d'échec"));
children.push(bullet("Gestion des erreurs 13xxx"));
children.push(bullet("Cache mémoire du token avec gestion de l'expiration"));

children.push(h2("4.4 Intégration dans l'App"));
children.push(bullet("Hook useAuth() qui expose le token et son état"));
children.push(bullet("Écran de chargement pendant l'authentification"));
children.push(bullet("Gestion de l'erreur d'auth (message, bouton réessayer)"));

children.push(h2("4.5 Test"));
children.push(bullet("Tester le SSO sur le tenant de test"));
children.push(bullet("Vérifier le token reçu (décodage JWT dans la console)"));
children.push(bullet("Tester le fallback MSAL en forçant un échec du SSO"));

children.push(h2("4.6 Livrables"));
children.push(bullet("App Registration Azure opérationnelle"));
children.push(bullet("Module AuthService fonctionnel"));
children.push(bullet("Token Graph obtenu avec succès"));

// ===== Phase 5 =====
children.push(h1("Phase 5 — Client Microsoft Graph"));
children.push(p("Durée : 1 jour", { italics: true, color: "616161" }));
children.push(p("Objectif : récupérer les vraies données calendrier et mails depuis Microsoft Graph."));

children.push(h2("5.1 Installation du SDK Graph"));
children.push(bullet("npm install @microsoft/microsoft-graph-client"));
children.push(bullet("npm install @microsoft/microsoft-graph-types (types TypeScript)"));

children.push(h2("5.2 Module GraphClient"));
children.push(p("Créer src/services/GraphClient.ts avec les méthodes :"));
children.push(bullet("getUserProfile() → informations utilisateur"));
children.push(bullet("getCalendarEvents(from, to) → événements du calendrier avec filtres"));
children.push(bullet("getSentMails(from, to) → métadonnées des mails envoyés (select=sentDateTime)"));

children.push(h2("5.3 Gestion des erreurs"));
children.push(bullet("Token expiré → refresh via AuthService"));
children.push(bullet("Rate limiting (429) → retry avec backoff exponentiel"));
children.push(bullet("Boîte vide → retour gracieux"));
children.push(bullet("Événements récurrents → gérer correctement seriesMaster et occurrences"));
children.push(bullet("Événements all-day → filtrer dès le départ"));

children.push(h2("5.4 Hook useGraphData"));
children.push(bullet("Hook qui remplace useMockData"));
children.push(bullet("Récupère les données pour la semaine en cours"));
children.push(bullet("État loading, error, data"));
children.push(bullet("Retourne les mêmes types TypeScript que mockData (contrat UI inchangé)"));

children.push(h2("5.5 Tests manuels avec Graph Explorer"));
children.push(bullet("Valider les requêtes sur developer.microsoft.com/graph/graph-explorer"));
children.push(bullet("Vérifier le format exact des réponses"));
children.push(bullet("Identifier les cas limites (événements annulés, déclinés, récurrents)"));

children.push(h2("5.6 Livrables"));
children.push(bullet("Module GraphClient fonctionnel"));
children.push(bullet("Hook useGraphData qui remplace useMockData sans changer l'UI"));
children.push(bullet("Données calendrier et mails récupérées depuis le vrai Outlook"));

// ===== Phase 6 =====
children.push(h1("Phase 6 — Moteur de calcul des scores"));
children.push(p("Durée : 1 à 1,5 jour", { italics: true, color: "616161" }));
children.push(p("Objectif : transformer les données brutes Graph en scores et facteurs."));

children.push(h2("6.1 Filtrage des événements"));
children.push(bullet("Au moins 2 participants (organisateur + 1 invité)"));
children.push(bullet("Utilisateur a accepté (responseStatus != declined et != none)"));
children.push(bullet("Pas un événement all-day"));
children.push(p("Créer src/logic/EventFilter.ts qui applique ces règles."));

children.push(h2("6.2 Module ScoreCalculator"));
children.push(p("Créer src/logic/ScoreCalculator.ts avec une méthode par facteur :"));

children.push(h3("Facteur 1 — Multi-tâche"));
children.push(bullet("Pour chaque réunion, compter les mails envoyés pendant"));
children.push(bullet("Score = 25 × (réunions sans mail / total réunions)"));

children.push(h3("Facteur 2 — Transitions"));
children.push(bullet("Pour chaque réunion, vérifier gap ≥ 5 min avant et après"));
children.push(bullet("Première réunion : condition avant OK. Dernière : condition après OK"));
children.push(bullet("Score = 25 × (réunions avec transitions OK / total réunions)"));

children.push(h3("Facteur 3 — Débordement"));
children.push(bullet("25 pts si aucune activité hors 8h-20h"));
children.push(bullet("−10 pts par mail hors plage"));
children.push(bullet("0 pts si réunion hors plage"));

children.push(h3("Facteur 4 — Travail profond"));
children.push(bullet("Blocs ≥ 15 min sans réunion ni mail, dans 8h-12h30 + 13h30-20h"));
children.push(bullet("Entre le premier et le dernier mail envoyé"));
children.push(bullet("10 pts par heure, max 25"));

children.push(h2("6.3 Transformation vers les types UI"));
children.push(bullet("Mapper les résultats de calcul vers DayScore, Factor, TimelineEvent, TimelineOverlay"));
children.push(bullet("Générer les overlays timeline (zones pour chaque facteur)"));
children.push(bullet("Calcul du score global et de sa couleur sémantique"));

children.push(h2("6.4 Tests unitaires"));
children.push(bullet("Framework : Vitest"));
children.push(bullet("Fixtures : journée idéale, surchargée, avec débordement, vide"));
children.push(bullet("Tests critiques car le calcul est le cœur du produit"));

children.push(h2("6.5 Intégration dans useGraphData"));
children.push(bullet("useGraphData devient : fetch Graph → filter → calculate → map UI types"));
children.push(bullet("Les composants UI restent inchangés"));

children.push(h2("6.6 Livrables"));
children.push(bullet("Module ScoreCalculator complet"));
children.push(bullet("Suite de tests unitaires"));
children.push(bullet("TaskPane affichant les vrais scores calculés depuis Graph"));

// ===== Phase 7 =====
children.push(h1("Phase 7 — Stockage local et cache"));
children.push(p("Durée : 0,5 jour", { italics: true, color: "616161" }));

children.push(h2("7.1 Module StorageService"));
children.push(p("Créer src/services/StorageService.ts :"));
children.push(bullet("Stockage des scores calculés dans Office.context.roamingSettings"));
children.push(bullet("Cache des données brutes Graph dans localStorage"));
children.push(bullet("API : saveDayScore, getDayScore, getWeekScores, purgeExpired"));
children.push(bullet("Expiration automatique 90 jours"));

children.push(h2("7.2 Stratégie cache-then-refresh"));
children.push(bullet("Premier chargement : afficher le cache immédiatement puis rafraîchir en background"));
children.push(bullet("Bouton Actualiser : force le refetch"));
children.push(bullet("Invalidation automatique pour le jour en cours"));

children.push(h2("7.3 Livrables"));
children.push(bullet("Module StorageService"));
children.push(bullet("Cache-then-refresh en place dans useGraphData"));
children.push(bullet("Purge automatique des données expirées"));

// ===== Phase 8 =====
children.push(h1("Phase 8 — Tests end-to-end et finitions"));
children.push(p("Durée : 1 jour", { italics: true, color: "616161" }));

children.push(h2("8.1 Scénarios de test"));
children.push(numItem("Journée avec données réelles"));
children.push(numItem("Journée vide (futur)"));
children.push(numItem("Changement de jour via week selector"));
children.push(numItem("Hover facteurs et overlays timeline"));
children.push(numItem("Clic Actualiser"));
children.push(numItem("Fermeture/réouverture du TaskPane"));
children.push(numItem("Token expiré et re-authentification"));
children.push(numItem("Connexion lente (throttling DevTools)"));

children.push(h2("8.2 Tests multi-plateformes"));
children.push(bullet("Outlook Web (Chrome, Edge)"));
children.push(bullet("Outlook Desktop Windows"));
children.push(bullet("Outlook Desktop Mac"));

children.push(h2("8.3 États UI"));
children.push(bullet("Loading : Spinner ou Skeleton Fluent"));
children.push(bullet("Erreur : MessageBar avec bouton réessayer"));
children.push(bullet("Pas de données : message explicite"));
children.push(bullet("Première ouverture : onboarding court optionnel"));

children.push(h2("8.4 Finitions UX"));
children.push(bullet("Transitions fluides entre les jours"));
children.push(bullet("Feedback visuel sur les actions (toast Fluent)"));
children.push(bullet("Accessibilité (aria-labels, navigation clavier)"));
children.push(bullet("Responsive si TaskPane redimensionné"));

children.push(h2("8.5 Livrables"));
children.push(bullet("Add-in complet et stable sur les 3 plateformes"));
children.push(bullet("Check-list des scénarios testés"));

// ===== Phase 9 =====
children.push(h1("Phase 9 — Packaging et déploiement pilote"));
children.push(p("Durée : 0,5 jour", { italics: true, color: "616161" }));

children.push(h2("9.1 Manifest final et versioning"));
children.push(bullet("Versioner en 1.0.0"));
children.push(bullet("Valider via Microsoft Office Add-in Validator"));
children.push(bullet("Documentation des scopes demandés pour l'admin IT"));

children.push(h2("9.2 Déploiement pilote"));
children.push(bullet("Upload du manifest dans le M365 Admin Center du tenant de test ou d'un client pilote"));
children.push(bullet("Consentement administrateur sur les scopes Graph"));
children.push(bullet("Déploiement à un groupe restreint (3-5 utilisateurs volontaires)"));
children.push(bullet("Collecte de feedback"));

children.push(h2("9.3 Documentation"));
children.push(bullet("Guide admin : déploiement via M365 Admin Center, consentement, scopes"));
children.push(bullet("Guide utilisateur : interprétation des scores, dépannage"));
children.push(bullet("Docs techniques : architecture, API, contribution au code"));

children.push(h2("9.4 Livrables"));
children.push(bullet("Manifest v1.0.0 validé"));
children.push(bullet("Add-in installé et fonctionnel chez les utilisateurs pilotes"));
children.push(bullet("Documentation complète"));

// Page break
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===== Récapitulatif =====
children.push(h1("Récapitulatif du chemin critique"));

const recapRows = [
  ["Phase", "Durée", "Livrable clé"],
  ["1 — Setup minimal add-in", "0,5-1j", "Bouton Gr33t visible dans Outlook"],
  ["2 — UI + données mockées", "1,5-2j", "TaskPane visuellement complet"],
  ["3 — Hébergement stable", "0,5j", "Add-in installable sur d'autres postes"],
  ["4 — Auth et App Registration", "0,5-1j", "Token Graph obtenu"],
  ["5 — Client Microsoft Graph", "1j", "Données réelles récupérées"],
  ["6 — Moteur de calcul", "1-1,5j", "Scores calculés depuis données réelles"],
  ["7 — Stockage local", "0,5j", "Cache et expiration 90j"],
  ["8 — Tests E2E + finitions", "1j", "Add-in stable multi-plateformes"],
  ["9 — Packaging + pilote", "0,5j", "Déploiement pilote"],
  ["Total", "7 à 9 jours", "—"],
];

const colWidths = [3000, 1600, 4400];
const rebuiltRows = recapRows.map((row, i) => new TableRow({
  tableHeader: i === 0,
  children: row.map((cell, j) => {
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
  columnWidths: colWidths,
  rows: rebuiltRows,
}));

children.push(spacer());
children.push(p("Total estimé entre 7 et 9 jours, avec une démonstration visuelle possible dès la fin de la phase 2 (3 jours)."));

// ===== Jalons =====
children.push(h1("Jalons de démonstration"));

children.push(h2("Jalon 1 — Fin phase 2 (~3 jours)"));
children.push(p("TaskPane visuellement complet avec données mockées, installé dans votre Outlook en local."));
children.push(bullet("Démo interne à l'équipe"));
children.push(bullet("Validation du design et des interactions"));
children.push(bullet("Ajustements UX avant d'engager la partie technique"));

children.push(h2("Jalon 2 — Fin phase 3 (~3,5 jours)"));
children.push(p("Add-in hébergé, installable chez d'autres utilisateurs, toujours avec données mockées."));
children.push(bullet("Démo prospects / clients pilotes"));
children.push(bullet("Collecte de feedback sur le visuel"));
children.push(bullet("Validation du concept avant investissement dans la partie Graph"));

children.push(h2("Jalon 3 — Fin phase 6 (~7 jours)"));
children.push(p("Add-in complet avec vraies données et calcul des scores."));
children.push(bullet("Premier test réel avec votre propre calendrier"));
children.push(bullet("Validation de la pertinence des indicateurs"));

children.push(h2("Jalon 4 — Fin phase 9 (~9 jours)"));
children.push(p("Add-in en production, déployé chez les premiers utilisateurs pilotes."));
children.push(bullet("Pilote client"));
children.push(bullet("Itération sur le feedback"));

// ===== Avantages de cette approche =====
children.push(h1("Avantages de l'approche UI-first"));

children.push(bullet([{ text: "Feedback visuel rapide : ", bold: true }, "le TaskPane dans le vrai Outlook dès 1 jour"]));
children.push(bullet([{ text: "Découplage propre : ", bold: true }, "UI et données séparées par un contrat TypeScript, facilite les tests et les changements"]));
children.push(bullet([{ text: "Risques isolés : ", bold: true }, "chaque phase traite une complexité à la fois (sideload, puis auth, puis Graph, puis calcul)"]));
children.push(bullet([{ text: "Démonstration progressive : ", bold: true }, "4 jalons de démo permettent de montrer le produit très tôt"]));
children.push(bullet([{ text: "Pas de gâchis si pivot : ", bold: true }, "si le concept doit être retravaillé après le feedback visuel, la partie backend n'a pas été engagée"]));
children.push(bullet([{ text: "Cohérence Microsoft : ", bold: true }, "React + Fluent UI v9 aligne l'add-in sur l'écosystème Microsoft 365, facilite l'onboarding de développeurs, bénéficie des composants officiels"]));

// ===== Points d'attention =====
children.push(h1("Points d'attention"));

children.push(h2("Techniques"));
children.push(bullet("Le sideload d'un add-in en HTTPS local nécessite un certificat de confiance : le scaffolding Yeoman gère ça automatiquement mais ça peut coincer sur certains postes"));
children.push(bullet("Fluent UI v9 est la version moderne (pas v8 ni Northstar) : bien vérifier les imports et les exemples utilisés"));
children.push(bullet("Le bundle Fluent UI v9 est optimisé pour le tree-shaking : importer uniquement les composants utilisés"));
children.push(bullet("Office.js et React : le script office.js doit être chargé avant le bootstrap React"));
children.push(bullet("Taille du TaskPane : ~320-340 px de large en général, à tester sur mobile et redimensionnement"));

children.push(h2("Organisationnels"));
children.push(bullet("Bien séparer les phases avec mock et les phases avec vraies données pour profiter des jalons de démo"));
children.push(bullet("Versionner le projet sur Git dès la phase 1"));
children.push(bullet("Documenter les choix techniques au fur et à mesure"));
children.push(bullet("Prévoir une boucle de feedback après chaque jalon"));

// ===== Livrable final =====
children.push(h1("Livrable final de la V1"));
children.push(p("À la fin des 9 jours, on disposera :"));
children.push(bullet("Un add-in Outlook React + TypeScript + Fluent UI v9"));
children.push(bullet("Déployable via Azure Static Web Apps ou équivalent"));
children.push(bullet("Installable en 15 minutes chez n'importe quel client M365 via l'Admin Center"));
children.push(bullet("Fonctionnel sur Outlook Web, Windows et Mac"));
children.push(bullet("Affichant le score de récupération avec les 4 facteurs détaillés"));
children.push(bullet("Avec mini-timeline interactive et indicateurs au hover"));
children.push(bullet("Sélecteur de jour Lun-Ven"));
children.push(bullet("Courbe de tendance sur 3 semaines"));
children.push(bullet("100% local, sans backend Gr33t"));
children.push(bullet("Permissions minimales : Calendars.Read + Mail.ReadBasic + User.Read"));
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
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Plan-developpement-Gr33t-Solo-v2.docx", buffer);
  console.log("✓ Document créé : Plan-developpement-Gr33t-Solo-v2.docx");
});
