/**
 * Utilitaires de formatage / calcul de dates pour le dashboard Rythme.
 * Tout est en français et en heure locale (Europe/Paris implicite).
 */

const WEEKDAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Format long français : "Lundi 14 avril 2026".
 * @param date Date ou string ISO "YYYY-MM-DD"
 */
export function formatDateLongFR(date: Date | string): string {
  const d = typeof date === "string" ? parseIsoDate(date) : date;
  const weekday = capitalize(WEEKDAYS[d.getDay()]);
  const month = MONTHS[d.getMonth()];
  return `${weekday} ${d.getDate()} ${month} ${d.getFullYear()}`;
}

/**
 * Format court : "7 avril" (utilisé dans les headers de semaine).
 */
export function formatDayMonthFR(date: Date | string): string {
  const d = typeof date === "string" ? parseIsoDate(date) : date;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * Plage de semaine : "7 → 11 avril".
 * Prend lundi et vendredi, concatène sur la même unité de mois si possible.
 */
export function formatWeekRangeFR(mondayIso: string): string {
  const monday = parseIsoDate(mondayIso);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const sameMonth = monday.getMonth() === friday.getMonth();
  if (sameMonth) {
    return `${monday.getDate()} → ${friday.getDate()} ${MONTHS[friday.getMonth()]}`;
  }
  return `${monday.getDate()} ${MONTHS[monday.getMonth()]} → ${friday.getDate()} ${MONTHS[friday.getMonth()]}`;
}

/**
 * Parse une date ISO "YYYY-MM-DD" en Date locale minuit.
 * Évite les décalages UTC liés à `new Date("2026-04-07")`.
 */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Numéro ISO 8601 de la semaine (1-53).
 * Algorithme classique : jeudi de la semaine → année ISO.
 */
export function getIsoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
