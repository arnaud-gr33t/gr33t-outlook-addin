/**
 * Utilitaires de positionnement des événements sur la timeline.
 *
 * Modèle : la plage horaire affichée est 7h → 21h (14h au total).
 * Les zones "hors horaires" (7-9h et 19-21h) sont hachurées derrière les
 * événements. Chaque événement est positionné en % du canvas journée.
 *
 * Règles de sévérité (tlSeverity) : dérivée de `trans` + `multi` + `future`,
 * portée fidèle de scenario-C-rythme_31.html.
 */

import type { Meeting } from "../types/data-contract";

const RANGE_START_MIN = 7 * 60;
const RANGE_END_MIN = 21 * 60;
const RANGE_SPAN_MIN = RANGE_END_MIN - RANGE_START_MIN;

/**
 * Filtre : les bandes de focus de durée < FOCUS_MIN_MIN minutes sont
 * ignorées dans la vue compacte (trop fines à afficher proprement).
 */
export const FOCUS_MIN_MIN = 20;

/** Convertit "HH:MM" en nombre de minutes depuis minuit. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Convertit une heure "HH:MM" en pourcentage 0-100 sur la plage 7h-21h.
 * Les valeurs hors plage sont clampées.
 */
export function timeToPercent(time: string): number {
  const total = timeToMinutes(time);
  const pct = ((total - RANGE_START_MIN) / RANGE_SPAN_MIN) * 100;
  return Math.max(0, Math.min(100, pct));
}

/**
 * Retourne `{ left, width }` en pourcentage pour une plage horaire.
 * `width` a un minimum de 0.3 % pour rester visible.
 */
export function rangeToPercent(start: string, end: string): {
  left: number;
  width: number;
} {
  const l = timeToPercent(start);
  const r = timeToPercent(end);
  return { left: l, width: Math.max(0.3, r - l) };
}

/** Durée d'une plage horaire en minutes. */
export function durationMinutes(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

export type MeetingSeverity =
  | "meeting-blue"
  | "meeting-orange"
  | "meeting-red"
  | "meeting-future"
  | "meeting-future-pending";

/**
 * Dérive la couleur de la barre d'une réunion selon 3 facteurs :
 *   - future : teinte atténuée (bleue ou orange si issue pending)
 *   - no-trans + multi ≥ 1  → rouge
 *   - multi ≥ 3             → rouge
 *   - no-trans seul         → orange
 *   - multi ≥ 1 seul        → orange
 *   - sinon                 → bleu
 */
export function meetingSeverity(m: Meeting): MeetingSeverity {
  if (m.future) {
    return m.trans === "ko" || m.multi > 0
      ? "meeting-future-pending"
      : "meeting-future";
  }
  const hasNoTrans = m.trans === "ko";
  const multi = m.multi ?? 0;
  if ((hasNoTrans && multi > 0) || multi >= 3) return "meeting-red";
  if (hasNoTrans || multi > 0) return "meeting-orange";
  return "meeting-blue";
}

/** Libellé humain de la sévérité d'une réunion (pour tooltip). */
export function meetingSeverityLabel(m: Meeting): string {
  if (m.future) return "À venir";
  const hasNoTrans = m.trans === "ko";
  const multi = m.multi ?? 0;
  if ((hasNoTrans && multi > 0) || multi >= 3) return "Conditions dégradées";
  if (hasNoTrans || multi > 0) return "Conditions moyennes";
  return "Bonnes conditions de réunion";
}

/** Libellé humain du compteur multitâche. */
export function multitaskLabel(count: number): string {
  if (count <= 0) return "Pas de multitâche";
  if (count === 1) return "1 interaction pendant";
  return `${count} interactions pendant`;
}
