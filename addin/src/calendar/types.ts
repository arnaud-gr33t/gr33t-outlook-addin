/**
 * Types partagés entre les providers de données (Solo/Premium) et le CalendarWriter.
 */

// ============================================================
// Facteurs de récupération
// ============================================================

export type FactorCls = "good" | "warn" | "bad" | "neutral";
export type RowCls = "ok" | "ko" | "alert";

export interface FactorRow {
  label: string;
  val: string;
  cls: RowCls;
}

export interface Factor {
  name: string;
  summary: string;
  cls: FactorCls;
  rows: FactorRow[];
}

// ============================================================
// Focus blocks et overtime
// ============================================================

export interface FocusBlock {
  start: Date;
  end: Date;
  durationMin: number;
  label: string; // ex: "1h30"
}

export interface OvertimeEvent {
  start: Date;
  end: Date;
  label: string; // ex: "Mail 21:15" ou "Figures of glass"
  type: "mail" | "meeting";
}

/**
 * Informations d'une réunion suivie par Gr33t (après filtrage).
 * Utilisé pour rendre la réunion dans la timeline du TaskPane avec
 * une bordure colorée selon le respect des facteurs Multi-tâche et Transition.
 */
export interface MeetingInfo {
  subject: string;
  start: Date;
  end: Date;
  /** Aucun mail envoyé pendant la réunion. */
  multitaskOk: boolean;
  /** Gap >= 5 min avant le début (true par défaut pour la 1ère réunion du jour). */
  transitionBeforeOk: boolean;
}

// ============================================================
// Données de récupération d'une journée
// ============================================================

export interface DayRecoveryData {
  date: string; // ISO date "2026-04-06"
  dayLabel: string; // "Lundi 6 avril"
  score: number; // 0-100
  scoreLabel: string; // "Suivi modéré des facteurs de récupération"
  factors: Factor[];
  focusBlocks: FocusBlock[];
  overtimeEvents: OvertimeEvent[];
  /** Réunions suivies (filtrées). Optionnel pour compat avec anciens payloads. */
  meetings?: MeetingInfo[];
}

// ============================================================
// DataProvider — interface abstraite
// ============================================================

/**
 * Interface commune entre le mode Solo (Graph) et Premium (API Gr33t).
 * Chaque provider retourne les mêmes données, seule la source diffère.
 */
export interface DataProvider {
  /**
   * Récupère les données de récupération pour un jour donné.
   * @param date ISO date string "2026-04-06"
   */
  getDayData(date: string): Promise<DayRecoveryData | null>;

  /**
   * Récupère les données pour une semaine de travail (Lun-Ven).
   * @param mondayDate ISO date string du lundi "2026-04-06"
   */
  getWeekData(mondayDate: string): Promise<(DayRecoveryData | null)[]>;
}

// ============================================================
// Types Graph bruts (pour le GraphDataProvider)
// ============================================================

/** Événement calendrier brut récupéré depuis Graph. */
export interface RawCalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees: Array<{
    emailAddress: { address: string; name: string };
    status: { response: string };
    type: string;
  }>;
  responseStatus: { response: string };
  isAllDay: boolean;
  showAs: string;
  organizer?: {
    emailAddress: { address: string };
  };
}

/** Mail envoyé brut récupéré depuis Graph. */
export interface RawSentMail {
  sentDateTime: string; // ISO datetime
}
