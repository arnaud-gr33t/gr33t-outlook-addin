// ============================================================
// CONTRAT DE DONNÉES — Dashboard Rythme (Gr33t)
// ============================================================
// Le dashboard Rythme consomme un objet `DashboardData` via un Context.
// En v1, ce Context est alimenté par `mockData`. Plus tard, il sera
// alimenté par un connecteur Microsoft Graph.
//
// NB : divergence volontaire avec le brief initial — on expose
// `trans` + `multi` directement (fidèle à la maquette et aux données
// Graph réelles) plutôt qu'un `conditions: 'ok'|'medium'|'degraded'`
// pré-calculé. La dérivation se fait dans `utils/layout-utils.ts`.

/** Racine de toutes les données affichées dans l'onglet "Mon rythme". */
export interface DashboardData {
  /** Date de référence (= "aujourd'hui") au format ISO 8601, ex: "2026-04-14". */
  referenceDate: string;
  /** Les 3 semaines affichées : [S-1, S, S+1]. */
  weeks: [WeekData, WeekData, WeekData];
  /** Score IRA actuel (carte compacte). */
  ira: IraScore;
  /** Les 4 leviers de récupération, dans l'ordre d'affichage. */
  leviers: [Levier, Levier, Levier, Levier];
  /** Les annotations affichées sur la timeline (5 par défaut). */
  annotations: Annotation[];
}

// ============================================================
// SEMAINES ET JOURS
// ============================================================

export interface WeekData {
  /** Numéro ISO de la semaine, ex: 15. */
  weekNumber: number;
  /** Date du lundi au format ISO, ex: "2026-04-07". */
  mondayDate: string;
  /** Temporalité de la semaine. */
  kind: "past" | "current" | "future";
  /** Score affiché à droite du header (bilan si past, projection sinon). null = pas de score. */
  score: WeekScore | null;
  /** Les 5 jours ouvrés Lun → Ven. */
  days: [DayData, DayData, DayData, DayData, DayData];
}

export interface WeekScore {
  /** Valeur entière.
   *   - kind 'value' : 0-100
   *   - kind 'delta' : entier signé
   *   - kind 'count' : nombre de réunions planifiées
   */
  value: number;
  /** Type d'affichage :
   *  - 'value' : score brut coloré (pos/mid selon value)
   *  - 'delta' : affiche le signe (+/-) avec couleur de variation
   *  - 'count' : nombre entier neutre (ex: "12 réunions planifiées") */
  kind: "value" | "delta" | "count";
  /** Libellé court sous le chiffre, ex: "IRA", "vs S-1", "RÉUNIONS". */
  label: string;
}

export interface DayData {
  /** Date ISO du jour, ex: "2026-04-07". */
  date: string;
  /** Label court, ex: "Lun". */
  shortLabel: string;
  /** Numéro du jour dans le mois, ex: 7. */
  dayNumber: number;
  /** True si la date == referenceDate (highlight visuel). */
  isToday: boolean;
  /** Réunions de la journée. */
  meetings: Meeting[];
  /** Plages de focus observées ou suggérées. */
  focusBands: FocusBand[];
  /** Débordements horaires (mails/chats/réunions hors plage). */
  overflows: Overflow[];
}

// ============================================================
// ÉVÉNEMENTS SUR LA TIMELINE
// ============================================================

export interface Meeting {
  /** Heure de début, format 'HH:MM'. */
  start: string;
  /** Heure de fin, format 'HH:MM'. */
  end: string;
  /** Titre de la réunion (affiché dans tooltip). */
  title: string;
  /** Présence d'une transition (10 min libres) avant/après la réunion. */
  trans: "ok" | "ko";
  /** Nombre d'actions multitâches effectuées pendant (envoi mail, chat). */
  multi: number;
  /** True si la réunion est dans le futur. */
  future?: boolean;
}

export interface FocusBand {
  /** Heure de début du focus. */
  start: string;
  /** Heure de fin du focus. */
  end: string;
  /** Nature du focus :
   *  - 'observed' (passé) : plage calme observée a posteriori
   *  - 'opportunity' (futur) : créneau libre à exploiter
   *  - 'engaged' (futur) : plage bloquée volontairement par l'utilisateur */
  kind: "observed" | "opportunity" | "engaged";
}

export interface Overflow {
  /** Horodatage de l'action hors plage, ex: '19:47'. */
  time: string;
  /** Type d'action. */
  type: "mail_sent" | "chat_sent" | "meeting";
}

// ============================================================
// SCORE IRA
// ============================================================

export interface IraScore {
  /** Valeur du score 0-100. */
  value: number;
  /** Libellé qualitatif, ex: 'Capacité modérée'. */
  label: string;
  /** Variation par rapport à la semaine précédente (entier signé). */
  delta: number;
}

// ============================================================
// LEVIERS
// ============================================================

export type LevierId =
  | "transitions"
  | "concentration"
  | "horaires"
  | "focus_reunion";

export interface Levier {
  /** Identifiant stable. */
  id: LevierId;
  /** Côté positif (gauche). */
  positive: LevierSide;
  /** Côté négatif (droite). */
  negative: LevierSide;
}

export interface LevierSide {
  /** Libellé court affiché dans la rangée. */
  label: string;
  /** Description détaillée (tooltip au hover). */
  description: string;
  /** Pourcentage 0-100. `positive.percent + negative.percent` doit = 100. */
  percent: number;
  /** Couleur de la barre : variable CSS, ex: 'var(--tertiary)'. */
  colorVar: string;
}

// ============================================================
// ANNOTATIONS
// ============================================================

export type AnnotColor = "red" | "orange" | "positive";

export interface Annotation {
  /** Identifiant stable, ex: 'a1'. */
  id: string;
  /** Numéro affiché dans le marqueur (1-5). */
  number: number;
  /** Temporalité (passé vs futur). */
  temporality: "past" | "future";
  /** Couleur du marqueur. */
  markerColor: AnnotColor;
  /** Date du jour cible (clé d'ancrage sur la timeline). */
  targetDate: string;
  /** True si la bulle s'affiche en mode "default" (vue initiale). */
  shownByDefault: boolean;
  /** Position horizontale de la bulle sous la timeline (en % du row). */
  bubbleLeftPct: number;
  /** Contenu de la bulle (résumé court). */
  bubble: {
    /** Titre, ex: 'Mer 9 · chaîne 4×1h'. */
    title: string;
    /** Description courte (1-2 lignes). */
    description: string;
  };
  /** Contenu affiché dans l'encart conseil au clic. */
  conseil: {
    /** Titre du conseil (= action recommandée). */
    title: string;
    /** Explication neuroscientifique (HTML <strong> autorisé). */
    explanation: string;
    /** Chiffre/fait issu d'une étude. */
    study: string;
    /** Source de l'étude. */
    studySource: string;
    /** Effort estimé, ex: '1/5'. */
    effort: string;
    /** Libellé effort, ex: 'très faible'. */
    effortLabel: string;
    /** Impact IRA, ex: '+12 pts'. */
    impact: string;
  };
}
