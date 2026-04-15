/**
 * Adaptateur pur : convertit DayRecoveryData (couche calendar/)
 * vers DayScore + TimelineData (couche UI types/).
 *
 * Aucun I/O, aucune dépendance Graph. Testable unitairement.
 */
import type {
  DayRecoveryData,
  Factor as RecoveryFactor,
  FactorRow as RecoveryFactorRow,
  FocusBlock,
  OvertimeEvent,
} from "../calendar/types";
import type {
  DayScore,
  Factor,
  FactorRow,
  FactorType,
  StatusClass,
  TimelineData,
  TimelineEvent,
} from "../types";

const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

/**
 * Ordre des facteurs tel que produit par scoreCalculator.calculateDayRecovery :
 * [Multi-tâche, Transitions, Débordement, Plage de travail profond disponible]
 */
const FACTOR_TYPES: FactorType[] = [
  "multitask",
  "transitions",
  "debordement",
  "deepwork",
];

function mapRowStatusClass(cls: RecoveryFactorRow["cls"]): StatusClass {
  switch (cls) {
    case "ok":
      return "ok";
    case "ko":
      return "nok";
    case "alert":
      return "alert";
  }
}

function mapRow(row: RecoveryFactorRow): FactorRow {
  return {
    label: row.label,
    status: row.val,
    statusClass: mapRowStatusClass(row.cls),
  };
}

function mapFactor(factor: RecoveryFactor, index: number): Factor {
  return {
    type: FACTOR_TYPES[index] ?? "multitask",
    name: factor.name,
    summary: factor.summary,
    summaryClass: factor.cls,
    rows: factor.rows.map(mapRow),
    more: null,
  };
}

/** Convertit un Date en heure décimale (9h30 → 9.5). */
function toDecimalHour(d: Date): number {
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

function focusToTimelineEvent(block: FocusBlock): TimelineEvent {
  return {
    start: toDecimalHour(block.start),
    end: toDecimalHour(block.end),
    name: `Focus (${block.label})`,
    variant: "teal",
  };
}

function overtimeToTimelineEvent(event: OvertimeEvent): TimelineEvent {
  return {
    start: toDecimalHour(event.start),
    end: toDecimalHour(event.end),
    name: event.label,
    variant: "purple",
  };
}

export interface RecoveryAdaptedData {
  score: DayScore;
  timeline: TimelineData;
}

/**
 * Mappe un DayRecoveryData vers les types UI (DayScore + TimelineData).
 * Les TimelineOverlays sont vides pour l'instant — les zones par facteur
 * ne sont pas encore calculées côté backend.
 */
export function recoveryToDayScore(
  data: DayRecoveryData
): RecoveryAdaptedData {
  const dateObj = new Date(data.date);
  const weekday = WEEKDAY_SHORT[dateObj.getDay()] ?? "";
  const dayNum = dateObj.getDate().toString();

  const score: DayScore = {
    dayLabel: data.dayLabel,
    weekday,
    dayNum,
    score: data.score,
    scoreLabel: data.scoreLabel,
    factors: data.factors.length > 0 ? data.factors.map(mapFactor) : null,
  };

  const events: TimelineEvent[] = [
    ...data.focusBlocks.map(focusToTimelineEvent),
    ...data.overtimeEvents.map(overtimeToTimelineEvent),
  ].sort((a, b) => a.start - b.start);

  const timeline: TimelineData = {
    events,
    overlays: {
      multitask: [],
      transitions: [],
      debordement: [],
      deepwork: [],
    },
  };

  return { score, timeline };
}
