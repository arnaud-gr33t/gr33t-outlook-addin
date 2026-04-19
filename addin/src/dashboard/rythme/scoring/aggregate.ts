/**
 * Agrégations IRA : journalier → hebdomadaire → 30 jours.
 * Spéc : `Calcul_IRA.v1.1.md` §Agrégation.
 */
import type { DailyScores } from "./daily";

export interface DatedScores extends DailyScores {
  /** ISO "YYYY-MM-DD" */
  date: string;
}

export interface AggregatedScores {
  transitions: number;
  concentration: number;
  horaires: number;
  focus: number;
  ira: number;
}

/** Moyenne arithmétique arrondie à l'entier, ou null si liste vide. */
function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return Math.round(s / nums.length);
}

/**
 * Moyenne sur un sous-ensemble de scores journaliers (tous facteurs + IRA).
 * Retourne null si aucun score.
 */
export function averageScores(days: DatedScores[]): AggregatedScores | null {
  if (days.length === 0) return null;
  return {
    transitions: avg(days.map((d) => d.transitions)) ?? 0,
    concentration: avg(days.map((d) => d.concentration)) ?? 0,
    horaires: avg(days.map((d) => d.horaires)) ?? 0,
    focus: avg(days.map((d) => d.focus)) ?? 0,
    ira: avg(days.map((d) => d.ira)) ?? 0,
  };
}

/** Moyenne IRA hebdomadaire sur les jours ouvrés (lun-ven) d'une semaine. */
export function weeklyScores(
  mondayIso: string,
  scoresByDate: Map<string, DailyScores>
): AggregatedScores | null {
  const [y, m, d] = mondayIso.split("-").map(Number);
  const collected: DatedScores[] = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(y, m - 1, d + i);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
    const s = scoresByDate.get(iso);
    if (s) collected.push({ ...s, date: iso });
  }
  return averageScores(collected);
}

/**
 * Moyenne IRA sur les 30 derniers jours calendaires terminés (weekends inclus).
 *
 * @param today Date de référence (typiquement `new Date()`)
 * @param scoresByDate Map des scores journaliers déjà calculés
 */
export function rolling30DaysScores(
  today: Date,
  scoresByDate: Map<string, DailyScores>
): AggregatedScores | null {
  const collected: DatedScores[] = [];
  for (let offset = 0; offset < 30; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
    const s = scoresByDate.get(iso);
    if (s) collected.push({ ...s, date: iso });
  }
  return averageScores(collected);
}

/**
 * Delta IRA : `IRA_30j(today) - IRA_30j(today - 7)`.
 * Retourne null si un des deux n'a pas assez de données.
 */
export function irra30DaysDelta(
  today: Date,
  scoresByDate: Map<string, DailyScores>
): number | null {
  const now = rolling30DaysScores(today, scoresByDate);
  const before = new Date(today);
  before.setDate(today.getDate() - 7);
  const then = rolling30DaysScores(before, scoresByDate);
  if (!now || !then) return null;
  return now.ira - then.ira;
}

/**
 * Libellé qualitatif selon le score IRA (3 bandes officielles du doc).
 */
export function iraLabel(score: number): string {
  if (score >= 70) return "Excellente capacité";
  if (score >= 50) return "Capacité modérée";
  return "Capacité faible";
}
