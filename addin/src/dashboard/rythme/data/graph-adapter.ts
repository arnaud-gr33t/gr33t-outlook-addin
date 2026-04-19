/**
 * Adapter : `DayRecoveryData` (payload Graph / calendrier Gr33t Recovery)
 *       →  `DayData` (contrat du dashboard Rythme).
 *
 * Utilisé par `useGraphDashboard` pour peupler la timeline avec les vraies
 * données de l'utilisateur. Les leviers, l'IRA et les annotations restent
 * injectés depuis le mock en v1.5 (voir `mergeWithMock`).
 */
import type {
  DayRecoveryData,
  MeetingInfo,
  OvertimeEvent,
  FocusBlock,
} from "../../../calendar/types";
import type {
  DashboardData,
  DayData,
  FocusBand,
  Meeting,
  Overflow,
  WeekData,
} from "../types/data-contract";

const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function toHHMM(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function parseIsoDateLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ============================================================
// Conversions unitaires
// ============================================================

export function adaptMeeting(m: MeetingInfo, now: Date): Meeting {
  return {
    start: toHHMM(m.start),
    end: toHHMM(m.end),
    title: m.subject,
    trans: m.transitionBeforeOk ? "ok" : "ko",
    multi: m.multitaskOk ? 0 : 1,
    future: m.start.getTime() > now.getTime() ? true : undefined,
  };
}

export function adaptFocusBlock(b: FocusBlock): FocusBand {
  return {
    start: toHHMM(b.start),
    end: toHHMM(b.end),
    kind: "observed",
  };
}

const OVERFLOW_TYPE_MAP: Record<OvertimeEvent["type"], Overflow["type"]> = {
  mail: "mail_sent",
  meeting: "meeting",
};

export function adaptOverflow(o: OvertimeEvent): Overflow {
  return {
    time: toHHMM(o.start),
    type: OVERFLOW_TYPE_MAP[o.type],
  };
}

// ============================================================
// Jour : recovery payload → DayData
// Si le payload est null, on construit un DayData vide (réunions futures
// pourront être ajoutées par `mergeFutureMeetings`).
// ============================================================

export function adaptDay(
  isoDate: string,
  recovery: DayRecoveryData | null,
  referenceDate: Date,
  today: Date
): DayData {
  const d = parseIsoDateLocal(isoDate);
  const dayOfWeek = d.getDay();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  if (!recovery) {
    return {
      date: isoDate,
      shortLabel: WEEKDAY_SHORT[dayOfWeek],
      dayNumber: d.getDate(),
      isToday,
      meetings: [],
      focusBands: [],
      overflows: [],
    };
  }

  return {
    date: recovery.date,
    shortLabel: WEEKDAY_SHORT[dayOfWeek],
    dayNumber: d.getDate(),
    isToday,
    meetings: (recovery.meetings ?? []).map((m) => adaptMeeting(m, referenceDate)),
    focusBands: recovery.focusBlocks.map(adaptFocusBlock),
    overflows: recovery.overtimeEvents.map(adaptOverflow),
  };
}

// ============================================================
// Semaine : construit WeekData en combinant fetchWeekRecovery + métadata
// ============================================================

export interface WeekInputs {
  mondayIso: string;
  /** Tableau de 5 éléments (Lun-Ven) — null si aucun score pour ce jour. */
  recoveries: (DayRecoveryData | null)[];
  kind: WeekData["kind"];
  /** Score affiché à droite du header (null = pas de score). */
  score: WeekData["score"];
  weekNumber: number;
}

export function buildWeekFromRecovery(
  inputs: WeekInputs,
  today: Date
): WeekData {
  const [y, m, d] = inputs.mondayIso.split("-").map(Number);
  const days: DayData[] = [];
  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(y, m - 1, d + i);
    const iso = `${dayDate.getFullYear()}-${pad2(dayDate.getMonth() + 1)}-${pad2(
      dayDate.getDate()
    )}`;
    days.push(adaptDay(iso, inputs.recoveries[i] ?? null, today, today));
  }
  return {
    weekNumber: inputs.weekNumber,
    mondayDate: inputs.mondayIso,
    kind: inputs.kind,
    score: inputs.score,
    days: days as WeekData["days"],
  };
}

// ============================================================
// Merge : remplace weeks.days du mock par les données Graph
// Les leviers / IRA / annotations restent en mock (v1.5).
// ============================================================

export function mergeWithMock(
  mock: DashboardData,
  weeks: [WeekData, WeekData, WeekData],
  referenceDate: string
): DashboardData {
  return {
    ...mock,
    referenceDate,
    weeks,
  };
}

// ============================================================
// Ajout de réunions futures : complète les DayData à partir d'une
// Map<isoDate, MeetingInfo[]> fournie par fetchFutureMeetings.
// Ne remplace pas les réunions existantes (si un jour a déjà une réunion
// issue du recovery, on skip ce jour — sinon on ajoute).
// ============================================================

export function mergeFutureMeetings(
  weeks: [WeekData, WeekData, WeekData],
  futureMeetingsByDate: Map<string, MeetingInfo[]>,
  referenceDate: Date
): [WeekData, WeekData, WeekData] {
  const enrich = (w: WeekData): WeekData => ({
    ...w,
    days: w.days.map((day) => {
      if (day.meetings.length > 0) return day; // déjà peuplé depuis recovery
      const future = futureMeetingsByDate.get(day.date);
      if (!future || future.length === 0) return day;
      return {
        ...day,
        meetings: future.map((m) => adaptMeeting(m, referenceDate)),
      };
    }) as WeekData["days"],
  });
  return [enrich(weeks[0]), enrich(weeks[1]), enrich(weeks[2])];
}
