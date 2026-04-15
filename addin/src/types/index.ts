/**
 * Types TypeScript pour le TaskPane Gr33t.
 *
 * Ces interfaces forment le contrat entre la couche données (mockData en Jalon 1,
 * puis Microsoft Graph + ScoreCalculator en phases ultérieures) et les composants UI.
 */

// ============================================================
// Facteurs de récupération
// ============================================================

/** Les 4 facteurs de récupération calculés par Gr33t. */
export type FactorType = "multitask" | "transitions" | "debordement" | "deepwork";

/** Classe sémantique de statut pour une ligne de détail de facteur. */
export type StatusClass = "ok" | "nok" | "alert";

/** Classe sémantique du résumé d'un facteur. */
export type SummaryClass = "good" | "warn" | "bad" | "neutral";

/** Bande de score : détermine la couleur et le label global. */
export type ScoreBand = "good" | "warn" | "bad" | "future";

/** Une ligne de détail à l'intérieur d'un facteur. */
export interface FactorRow {
  label: string;
  status: string;
  statusClass: StatusClass;
}

/** Un facteur de récupération avec son résumé et ses lignes de détail. */
export interface Factor {
  type: FactorType;
  name: string;
  summary: string;
  summaryClass: SummaryClass;
  rows: FactorRow[];
  more: string | null;
}

// ============================================================
// Score journalier
// ============================================================

/** Score et facteurs d'une journée. */
export interface DayScore {
  /** Libellé long, ex: "Lundi 6 avril". */
  dayLabel: string;
  /** Libellé court, ex: "Lun". */
  weekday: string;
  /** Numéro du jour, ex: "6". */
  dayNum: string;
  /** Score global sur 100, ou null si données pas encore disponibles. */
  score: number | null;
  /** Texte descriptif du score, ex: "Suivi modéré des facteurs de récupération". */
  scoreLabel: string | null;
  /** Liste des 4 facteurs, ou null si données pas disponibles. */
  factors: Factor[] | null;
}

// ============================================================
// Timeline
// ============================================================

/** Variante de couleur d'un événement dans la mini-timeline. */
export type EventVariant = "blue" | "purple" | "teal";

/** Teinte de bordure gauche pour signaler un état de conformité. */
export type BorderTone = "good" | "warn" | "bad";

/** Un événement de calendrier positionné sur la timeline. */
export interface TimelineEvent {
  /** Heure de début en décimal, ex: 9 pour 9h00, 9.75 pour 9h45. */
  start: number;
  /** Heure de fin en décimal. */
  end: number;
  /** Nom affiché de l'événement. */
  name: string;
  /** Variante de couleur (fond + texte). */
  variant: EventVariant;
  /** Si défini, surcharge la couleur de bordure gauche selon un état de conformité. */
  borderTone?: BorderTone;
}

/** Une zone d'overlay positionnée sur la timeline (zone de travail profond, alerte transition, etc.). */
export interface TimelineZone {
  /** Heure de début en décimal. */
  start: number;
  /** Heure de fin en décimal. */
  end: number;
  /** Label affiché dans l'overlay. */
  label: string;
}

/** Les 4 couches d'overlay, une par FactorType. */
export interface TimelineOverlays {
  multitask: TimelineZone[];
  transitions: TimelineZone[];
  debordement: TimelineZone[];
  deepwork: TimelineZone[];
}

/** Données timeline complètes d'une journée. */
export interface TimelineData {
  events: TimelineEvent[];
  overlays: TimelineOverlays;
}

// ============================================================
// Semaine
// ============================================================

/** Un jour de la semaine avec son score et sa timeline. */
export interface WeekDay {
  score: DayScore;
  timeline: TimelineData | null;
}

/** Une semaine de 5 jours (Lun-Ven). */
export type WeekData = WeekDay[];
