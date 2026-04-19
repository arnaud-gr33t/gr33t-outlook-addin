/**
 * Moteur de calcul — score journalier des 4 facteurs IRA.
 *
 * Spécification : `Calcul_IRA.v1.1.md`.
 *
 * Inputs :
 *   - meetings : réunions du jour (bornes + nb participants)
 *   - sends    : horodatages des mails envoyés ce jour
 *   - date     : le jour à scorer (utilisé pour détecter week-end)
 *
 * Outputs : 4 scores 0-100 + IRA journalier 0-100.
 */

export interface DailyMeeting {
  /** Borne de début (Date locale). */
  start: Date;
  /** Borne de fin (Date locale). */
  end: Date;
  /** Nombre d'autres participants (≥ 1 pour être comptée dans Focus). */
  otherAttendees: number;
}

export interface DailySend {
  /** Horodatage de l'envoi (Date locale). */
  sentAt: Date;
}

export interface DailyInputs {
  date: Date;
  meetings: DailyMeeting[];
  sends: DailySend[];
}

export interface DailyScores {
  transitions: number;
  concentration: number;
  horaires: number;
  focus: number;
  /** IRA journalier = somme pondérée arrondie. */
  ira: number;
}

// ============================================================
// Constantes de périmètre
// ============================================================
const WORK_START_H = 8;
const WORK_START_M = 0;
const WORK_END_H = 18;
const WORK_END_M = 30;
const TRANSITION_MIN = 10;
const FOCUS_MIN_HOURS = 2;
const FOCUS_MIN_MS = FOCUS_MIN_HOURS * 60 * 60 * 1000;
const TRANSITION_MS = TRANSITION_MIN * 60 * 1000;

// ============================================================
// Helpers temporels
// ============================================================
function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function setHm(d: Date, h: number, m: number): Date {
  const r = new Date(d);
  r.setHours(h, m, 0, 0);
  return r;
}

function workStart(day: Date): Date {
  return setHm(day, WORK_START_H, WORK_START_M);
}
function workEnd(day: Date): Date {
  return setHm(day, WORK_END_H, WORK_END_M);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ============================================================
// Factor 1 — Transitions préservées
// ============================================================

/**
 * Pourcentage de réunions entourées d'au moins 10 min de plage libre (avant OU après).
 *
 * Bords de plage :
 *   - 1re réunion du jour → transition "avant" = OK par défaut
 *   - Dernière réunion du jour → transition "après" = OK par défaut
 *
 * "Plage libre" = aucune autre réunion ET aucun envoi mail dans l'intervalle de 10 min.
 */
export function computeTransitions(
  meetings: DailyMeeting[],
  sends: DailySend[]
): number {
  if (meetings.length === 0) return 100;

  // Tri par début pour retrouver 1re / dernière
  const ordered = [...meetings].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  const hasActivityIn = (a: Date, b: Date, excludeMeeting: DailyMeeting) => {
    // Autres réunions dans [a, b[ ?
    for (const m of meetings) {
      if (m === excludeMeeting) continue;
      if (m.start < b && m.end > a) return true;
    }
    // Envois mail dans [a, b[ ?
    for (const s of sends) {
      if (s.sentAt >= a && s.sentAt < b) return true;
    }
    return false;
  };

  let ok = 0;
  ordered.forEach((m, i) => {
    const isFirst = i === 0;
    const isLast = i === ordered.length - 1;

    const beforeOk =
      isFirst ||
      !hasActivityIn(new Date(m.start.getTime() - TRANSITION_MS), m.start, m);
    const afterOk =
      isLast ||
      !hasActivityIn(m.end, new Date(m.end.getTime() + TRANSITION_MS), m);

    if (beforeOk || afterOk) ok++;
  });

  return Math.round((ok / ordered.length) * 100);
}

// ============================================================
// Factor 2 — Plages de concentration
// ============================================================

/**
 * Pourcentage du temps de travail hors réunion passé en plages continues ≥ 2 h
 * sans interruption (envoi mail ou début de réunion).
 *
 * Fenêtre de travail du jour : [max(first, 08:00), min(last, 18:30)]. Les
 * envois en débordement (avant 8h ou après 18:30) sont ignorés ici.
 */
export function computeConcentration(
  day: Date,
  meetings: DailyMeeting[],
  sends: DailySend[]
): number {
  const wStart = workStart(day);
  const wEnd = workEnd(day);

  // Collect candidates pour first/last
  const meetingTimes: Date[] = [];
  for (const m of meetings) {
    meetingTimes.push(m.start, m.end);
  }
  const sendTimes = sends.map((s) => s.sentAt);

  const allFirst = [...meetingTimes, ...sendTimes];
  if (allFirst.length === 0) return 100; // rien à fragmenter ce jour

  const first = new Date(Math.min(...allFirst.map((d) => d.getTime())));
  const last = new Date(Math.max(...allFirst.map((d) => d.getTime())));

  const start = first > wStart ? first : wStart;
  const end = last < wEnd ? last : wEnd;

  if (end.getTime() <= start.getTime()) return 100;

  // Ne garder que les réunions et envois dans la fenêtre
  const mInWindow = meetings.filter((m) => m.end > start && m.start < end);
  const sInWindow = sends.filter(
    (s) => s.sentAt >= start && s.sentAt < end
  );

  // Temps total hors réunions dans la fenêtre
  let meetingDurationInWindow = 0;
  for (const m of mInWindow) {
    const a = m.start < start ? start : m.start;
    const b = m.end > end ? end : m.end;
    meetingDurationInWindow += b.getTime() - a.getTime();
  }
  const timeOffMeetings = end.getTime() - start.getTime() - meetingDurationInWindow;
  if (timeOffMeetings <= 0) return 100;

  // Segmentation : construire les intervalles hors réunion, puis couper aux envois
  // Intervalles "hors réunion" dans la fenêtre
  const nonMeetingIntervals: [number, number][] = [];
  const sortedMeetings = [...mInWindow].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
  let cursor = start.getTime();
  for (const m of sortedMeetings) {
    const mStart = Math.max(m.start.getTime(), start.getTime());
    const mEnd = Math.min(m.end.getTime(), end.getTime());
    if (cursor < mStart) nonMeetingIntervals.push([cursor, mStart]);
    cursor = Math.max(cursor, mEnd);
  }
  if (cursor < end.getTime()) nonMeetingIntervals.push([cursor, end.getTime()]);

  // Couper chaque intervalle aux envois mail → plages focus candidates
  let focusTime = 0;
  for (const [a, b] of nonMeetingIntervals) {
    const cuts = sInWindow
      .map((s) => s.sentAt.getTime())
      .filter((t) => t > a && t < b)
      .sort((x, y) => x - y);
    const points = [a, ...cuts, b];
    for (let i = 0; i < points.length - 1; i++) {
      const seg = points[i + 1] - points[i];
      if (seg >= FOCUS_MIN_MS) focusTime += seg;
    }
  }

  return Math.round((focusTime / timeOffMeetings) * 100);
}

// ============================================================
// Factor 3 — Respect des horaires (binaire 0/100)
// ============================================================

/**
 * Score binaire : 100 si aucune activité hors 8h-18h30, 0 sinon.
 *
 * Week-ends :
 *   - aucune activité → 100
 *   - ≥ 1 activité → 0 (toute activité weekend = débordement)
 */
export function computeHoraires(
  day: Date,
  meetings: DailyMeeting[],
  sends: DailySend[]
): number {
  const hasActivity = meetings.length > 0 || sends.length > 0;

  if (isWeekend(day)) {
    return hasActivity ? 0 : 100;
  }

  const wStart = workStart(day);
  const wEnd = workEnd(day);

  for (const m of meetings) {
    if (m.start < wStart || m.end > wEnd) return 0;
  }
  for (const s of sends) {
    if (s.sentAt < wStart || s.sentAt > wEnd) return 0;
  }
  return 100;
}

// ============================================================
// Factor 4 — Focus en réunion (pas de tolérance)
// ============================================================

/**
 * Pourcentage de réunions (avec ≥ 1 autre participant) sans envoi de mail
 * pendant leur durée. Aucune tolérance en v1.1.
 */
export function computeFocus(
  meetings: DailyMeeting[],
  sends: DailySend[]
): number {
  const realMeetings = meetings.filter((m) => m.otherAttendees >= 1);
  if (realMeetings.length === 0) return 100;

  let ok = 0;
  for (const m of realMeetings) {
    const interrupted = sends.some(
      (s) => s.sentAt >= m.start && s.sentAt <= m.end
    );
    if (!interrupted) ok++;
  }
  return Math.round((ok / realMeetings.length) * 100);
}

// ============================================================
// IRA journalier (agrégation pondérée)
// ============================================================

export const WEIGHTS = {
  transitions: 0.3,
  concentration: 0.3,
  horaires: 0.25,
  focus: 0.15,
} as const;

export function computeIra(scores: Omit<DailyScores, "ira">): number {
  const raw =
    WEIGHTS.transitions * scores.transitions +
    WEIGHTS.concentration * scores.concentration +
    WEIGHTS.horaires * scores.horaires +
    WEIGHTS.focus * scores.focus;
  return Math.round(raw);
}

// ============================================================
// Entry point unifié
// ============================================================

export function computeDailyScores(inputs: DailyInputs): DailyScores {
  // Pour week-ends : Transitions/Concentration/Focus forcés à 100
  const weekend = isWeekend(inputs.date);
  const transitions = weekend
    ? 100
    : computeTransitions(inputs.meetings, inputs.sends);
  const concentration = weekend
    ? 100
    : computeConcentration(inputs.date, inputs.meetings, inputs.sends);
  const focus = weekend ? 100 : computeFocus(inputs.meetings, inputs.sends);
  const horaires = computeHoraires(inputs.date, inputs.meetings, inputs.sends);

  const scoresNoIra = { transitions, concentration, horaires, focus };
  const ira = computeIra(scoresNoIra);
  return { ...scoresNoIra, ira };
}

// Expose pour tests
export const _internal = { isWeekend, sameDay, workStart, workEnd };
