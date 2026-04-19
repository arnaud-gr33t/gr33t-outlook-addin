/**
 * Calcul des 4 facteurs de récupération Gr33t.
 * Logique portée depuis SPEC.md.
 *
 * Ce module est pur (pas d'I/O, pas de Graph) — il prend des événements et mails
 * en entrée et retourne les scores.
 */
import type {
  RawCalendarEvent,
  RawSentMail,
  Factor,
  FactorRow,
  FocusBlock,
  OvertimeEvent,
  DayRecoveryData,
  MeetingInfo,
} from "./types";

// ============================================================
// CONSTANTS
// ============================================================

/** Plage de travail usuelle. */
const WORK_START = 8; // 8h00
const WORK_END = 20; // 20h00
const LUNCH_START = 12.5; // 12h30
const LUNCH_END = 13.5; // 13h30

/** Seuil de transition (minutes). */
const TRANSITION_MIN_GAP = 5;

/** Seuil de focus (minutes). */
const FOCUS_MIN_DURATION = 15;

// ============================================================
// HELPERS
// ============================================================

function toDecimalHour(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

function parseDateTime(dateTimeStr: string): Date {
  return new Date(dateTimeStr);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

// ============================================================
// FILTERING
// ============================================================

interface TrackedMeeting {
  subject: string;
  start: Date;
  end: Date;
  mailsDuring: number;
}

/**
 * Filtre les réunions éligibles au suivi Gr33t.
 * Critères (SPEC.md) :
 * - Pas un événement all-day
 * - L'utilisateur a accepté (responseStatus != declined, != none)
 * - Au moins 1 invité (en plus de l'organisateur) a accepté la réunion
 */
function filterTrackedMeetings(
  events: RawCalendarEvent[],
  userEmail: string
): RawCalendarEvent[] {
  return events.filter((ev) => {
    // Pas un événement all-day
    if (ev.isAllDay) return false;

    // L'utilisateur a accepté
    const response = ev.responseStatus?.response?.toLowerCase() ?? "";
    if (response === "declined" || response === "none") return false;

    // Au moins 1 invité a accepté (en plus de l'organisateur)
    const acceptedAttendees = (ev.attendees ?? []).filter((att) => {
      const attResponse = att.status?.response?.toLowerCase() ?? "";
      return attResponse === "accepted" || attResponse === "organizer";
    });
    // On exclut l'organisateur du compte : il faut au moins 1 autre personne ayant accepté
    const nonOrganizerAccepted = acceptedAttendees.filter(
      (att) => att.emailAddress?.address?.toLowerCase() !== userEmail.toLowerCase()
    );
    if (nonOrganizerAccepted.length === 0) return false;

    return true;
  });
}

// ============================================================
// FACTOR 1 — MULTI-TÂCHE
// ============================================================

function calculateMultitasking(
  meetings: RawCalendarEvent[],
  sentMails: RawSentMail[]
): { score: number; factor: Factor; trackedMeetings: TrackedMeeting[] } {
  if (meetings.length === 0) {
    return {
      score: 25,
      factor: {
        name: "Multi-tâche",
        summary: "Aucune réunion",
        cls: "good",
        rows: [],
      },
      trackedMeetings: [],
    };
  }

  const mailDates = sentMails.map((m) => parseDateTime(m.sentDateTime));
  const trackedMeetings: TrackedMeeting[] = [];
  let meetingsWithoutMail = 0;

  const rows: FactorRow[] = meetings.map((ev) => {
    const start = parseDateTime(ev.start.dateTime);
    const end = parseDateTime(ev.end.dateTime);

    // Count mails sent during this meeting
    const mailsDuring = mailDates.filter((md) => md >= start && md <= end).length;

    trackedMeetings.push({
      subject: ev.subject,
      start,
      end,
      mailsDuring,
    });

    if (mailsDuring === 0) meetingsWithoutMail++;

    return {
      label: `${formatTime(start)}–${formatTime(end)} ${ev.subject}`,
      val: mailsDuring.toString(),
      cls: mailsDuring === 0 ? ("ok" as const) : ("ko" as const),
    };
  });

  const score = Math.round(25 * (meetingsWithoutMail / meetings.length));
  const summary = `${meetingsWithoutMail}/${meetings.length} réunions`;
  const cls = meetingsWithoutMail === meetings.length ? "good" : meetingsWithoutMail > 0 ? "warn" : "bad";

  return {
    score,
    factor: { name: "Multi-tâche", summary, cls, rows },
    trackedMeetings,
  };
}

// ============================================================
// FACTOR 2 — TRANSITIONS
// ============================================================

function calculateTransitions(meetings: RawCalendarEvent[]): {
  score: number;
  factor: Factor;
} {
  if (meetings.length === 0) {
    return {
      score: 25,
      factor: {
        name: "Transitions",
        summary: "Aucune réunion",
        cls: "good",
        rows: [],
      },
    };
  }

  // Sort by start time
  const sorted = [...meetings].sort(
    (a, b) => parseDateTime(a.start.dateTime).getTime() - parseDateTime(b.start.dateTime).getTime()
  );

  let okCount = 0;
  const rows: FactorRow[] = sorted.map((ev, i) => {
    const start = parseDateTime(ev.start.dateTime);
    const end = parseDateTime(ev.end.dateTime);

    // Check gap before (except first meeting: always OK)
    let gapBeforeOk = true;
    if (i > 0) {
      const prevEnd = parseDateTime(sorted[i - 1].end.dateTime);
      const gapBefore = (start.getTime() - prevEnd.getTime()) / 60000;
      gapBeforeOk = gapBefore >= TRANSITION_MIN_GAP;
    }

    // Check gap after (except last meeting: always OK)
    let gapAfterOk = true;
    if (i < sorted.length - 1) {
      const nextStart = parseDateTime(sorted[i + 1].start.dateTime);
      const gapAfter = (nextStart.getTime() - end.getTime()) / 60000;
      gapAfterOk = gapAfter >= TRANSITION_MIN_GAP;
    }

    const isOk = gapBeforeOk && gapAfterOk;
    if (isOk) okCount++;

    return {
      label: `${formatTime(start)}–${formatTime(end)} ${ev.subject}`,
      val: isOk ? "ok" : "ko",
      cls: isOk ? ("ok" as const) : ("ko" as const),
    };
  });

  const score = Math.round(25 * (okCount / meetings.length));
  const summary = `${okCount}/${meetings.length} réunions`;
  const cls = okCount === meetings.length ? "good" : okCount > 0 ? "warn" : "bad";

  return {
    score,
    factor: { name: "Transitions", summary, cls, rows },
  };
}

// ============================================================
// FACTOR 3 — DÉBORDEMENT
// ============================================================

function calculateOvertime(
  events: RawCalendarEvent[],
  sentMails: RawSentMail[]
): { score: number; factor: Factor; overtimeEvents: OvertimeEvent[] } {
  const overtime: OvertimeEvent[] = [];

  // Check meetings outside 8h-20h
  let meetingOutside = false;
  events.forEach((ev) => {
    if (ev.isAllDay) return;
    const start = parseDateTime(ev.start.dateTime);
    const end = parseDateTime(ev.end.dateTime);
    const startH = toDecimalHour(start);
    const endH = toDecimalHour(end);

    if (startH < WORK_START || endH > WORK_END) {
      meetingOutside = true;
      overtime.push({
        start,
        end,
        label: ev.subject,
        type: "meeting",
      });
    }
  });

  // Collect mails outside 8h-20h, then regrouper en clusters temporels
  // (fenêtre consécutive ≤ 15 min) pour éviter de saturer la timeline quand
  // plusieurs mails partent en rafale (ex: 4 mails à 7h du matin).
  const MAIL_CLUSTER_GAP_MIN = 15;
  const outOfRangeMails: Date[] = [];
  sentMails.forEach((m) => {
    const d = parseDateTime(m.sentDateTime);
    const h = toDecimalHour(d);
    if (h < WORK_START || h >= WORK_END) {
      outOfRangeMails.push(d);
    }
  });

  const mailsOutside = outOfRangeMails.length;

  outOfRangeMails.sort((a, b) => a.getTime() - b.getTime());
  interface MailCluster { start: Date; end: Date; count: number }
  const clusters: MailCluster[] = [];
  for (const d of outOfRangeMails) {
    const last = clusters[clusters.length - 1];
    if (last && d.getTime() - last.end.getTime() <= MAIL_CLUSTER_GAP_MIN * 60000) {
      last.end = d;
      last.count++;
    } else {
      clusters.push({ start: d, end: d, count: 1 });
    }
  }

  clusters.forEach((c) => {
    const label =
      c.count === 1
        ? `Mail ${formatTime(c.start)}`
        : `${c.count} mails à ${c.start.getHours()}h`;
    overtime.push({
      start: c.start,
      end: new Date(c.end.getTime() + 5 * 60000), // bloc ≥5 min après le dernier mail
      label,
      type: "mail",
    });
  });

  let score: number;
  let summary: string;
  let cls: "good" | "warn" | "bad";
  const rows: FactorRow[] = [];

  if (meetingOutside) {
    score = 0;
    const meetingCount = overtime.filter((o) => o.type === "meeting").length;
    summary = `${meetingCount} réunion${meetingCount > 1 ? "s" : ""} hors plage`;
    cls = "bad";
    overtime
      .filter((o) => o.type === "meeting")
      .forEach((o) => {
        rows.push({ label: `${formatTime(o.start)}–${formatTime(o.end)} ${o.label}`, val: "⚠", cls: "alert" });
      });
  } else if (mailsOutside > 0) {
    score = Math.max(0, 25 - mailsOutside * 10);
    summary = `${mailsOutside} mail${mailsOutside > 1 ? "s" : ""} hors plage`;
    cls = "bad";
    overtime
      .filter((o) => o.type === "mail")
      .forEach((o) => {
        rows.push({ label: o.label, val: "⚠", cls: "alert" });
      });
  } else {
    score = 25;
    summary = "aucun débordement";
    cls = "good";
  }

  return {
    score,
    factor: { name: "Débordement", summary, cls, rows },
    overtimeEvents: overtime,
  };
}

// ============================================================
// FACTOR 4 — TRAVAIL PROFOND
// ============================================================

function calculateDeepWork(
  date: string,
  events: RawCalendarEvent[],
  sentMails: RawSentMail[]
): { score: number; factor: Factor; focusBlocks: FocusBlock[] } {
  const mailDates = sentMails.map((m) => parseDateTime(m.sentDateTime));

  // Find first and last mail to determine "usual" work range
  if (mailDates.length === 0) {
    return {
      score: 0,
      factor: {
        name: "Plage de travail profond disponible",
        summary: "Pas de données mail",
        cls: "neutral",
        rows: [],
      },
      focusBlocks: [],
    };
  }

  const sortedMails = [...mailDates].sort((a, b) => a.getTime() - b.getTime());
  const firstMail = sortedMails[0];
  const lastMail = sortedMails[sortedMails.length - 1];

  // Work within usual hours (8h-12h30 + 13h30-20h), bounded by first/last mail
  const dayStart = new Date(firstMail);
  dayStart.setHours(WORK_START, 0, 0, 0);
  const effectiveStart = firstMail.getTime() > dayStart.getTime() ? dayStart : dayStart;

  // Plafond "temps écoulé" : si la date calculée est aujourd'hui, on ne
  // considère comme focus disponible que les plages DÉJÀ passées. Les
  // heures à venir ne sont pas encore du focus réalisé.
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const isToday = date === todayStr;
  const nowMs = now.getTime();

  // Build list of "busy" periods (meetings + mails)
  const busyPeriods: Array<{ start: Date; end: Date }> = [];

  // Add meetings (non-all-day)
  events.forEach((ev) => {
    if (ev.isAllDay) return;
    busyPeriods.push({
      start: parseDateTime(ev.start.dateTime),
      end: parseDateTime(ev.end.dateTime),
    });
  });

  // Add mails as point events (1 min each)
  mailDates.forEach((md) => {
    busyPeriods.push({
      start: md,
      end: new Date(md.getTime() + 60000),
    });
  });

  // Sort by start
  busyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Find free blocks within work hours (8h-12h30 + 13h30-20h), excluding lunch
  const workRanges = [
    { start: WORK_START, end: LUNCH_START },
    { start: LUNCH_END, end: WORK_END },
  ];

  const focusBlocks: FocusBlock[] = [];
  const referenceDate = new Date(firstMail);
  referenceDate.setHours(0, 0, 0, 0);

  for (const range of workRanges) {
    const rangeStart = new Date(referenceDate);
    rangeStart.setHours(Math.floor(range.start), (range.start % 1) * 60, 0, 0);
    const rangeEnd = new Date(referenceDate);
    rangeEnd.setHours(Math.floor(range.end), (range.end % 1) * 60, 0, 0);

    // Si aujourd'hui et la plage est entièrement future → on l'ignore
    if (isToday && rangeStart.getTime() >= nowMs) continue;
    // Si aujourd'hui et la plage dépasse l'heure courante → tronquer
    if (isToday && rangeEnd.getTime() > nowMs) {
      rangeEnd.setTime(nowMs);
    }

    // Merge busy periods within this range
    let cursor = rangeStart.getTime();

    const rangesBusy = busyPeriods.filter(
      (bp) => bp.end.getTime() > rangeStart.getTime() && bp.start.getTime() < rangeEnd.getTime()
    );

    for (const bp of rangesBusy) {
      const bpStart = Math.max(bp.start.getTime(), rangeStart.getTime());
      if (bpStart > cursor) {
        const gapMin = Math.round((bpStart - cursor) / 60000);
        if (gapMin >= FOCUS_MIN_DURATION) {
          const blockStart = new Date(cursor);
          const blockEnd = new Date(bpStart);
          focusBlocks.push({
            start: blockStart,
            end: blockEnd,
            durationMin: gapMin,
            label: formatDuration(gapMin),
          });
        }
      }
      cursor = Math.max(cursor, bp.end.getTime());
    }

    // Check remaining gap at end of range
    if (cursor < rangeEnd.getTime()) {
      const gapMin = Math.round((rangeEnd.getTime() - cursor) / 60000);
      if (gapMin >= FOCUS_MIN_DURATION) {
        focusBlocks.push({
          start: new Date(cursor),
          end: rangeEnd,
          durationMin: gapMin,
          label: formatDuration(gapMin),
        });
      }
    }
  }

  // Score: 10 pts per hour, max 25
  const totalFocusHours = focusBlocks.reduce((sum, b) => sum + b.durationMin / 60, 0);
  const score = Math.min(25, Math.round(totalFocusHours * 10));

  const totalLabel = formatDuration(focusBlocks.reduce((sum, b) => sum + b.durationMin, 0));
  const rows: FactorRow[] = focusBlocks.map((b) => ({
    label: `${formatTime(b.start)}–${formatTime(b.end)} (${b.durationMin} min)`,
    val: "✓",
    cls: "ok" as const,
  }));

  return {
    score,
    factor: {
      name: "Plage de travail profond disponible",
      summary: `${focusBlocks.length} blocs · ${totalLabel}`,
      cls: "neutral",
      rows,
    },
    focusBlocks,
  };
}

// ============================================================
// MAIN CALCULATOR
// ============================================================

/**
 * Calcule les 4 facteurs de récupération pour une journée.
 */
export function calculateDayRecovery(
  date: string,
  events: RawCalendarEvent[],
  sentMails: RawSentMail[],
  userEmail: string
): DayRecoveryData {
  // Filter tracked meetings
  const tracked = filterTrackedMeetings(events, userEmail);

  // Calculate each factor
  const mt = calculateMultitasking(tracked, sentMails);
  const tr = calculateTransitions(tracked);
  const ot = calculateOvertime(events, sentMails);
  const dw = calculateDeepWork(date, events, sentMails);

  // Détection : journée pas encore commencée (avant WORK_START sur aujourd'hui).
  // Dans ce cas, le facteur "Travail profond" n'est pas applicable et le score
  // est renormalisé sur les 3 autres facteurs (base 75 → 100).
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const dayNotStarted = date === todayStr && now.getHours() < WORK_START;

  let score: number;
  let deepWorkFactor: Factor;
  if (dayNotStarted) {
    const partial = mt.score + tr.score + ot.score;
    score = Math.round((partial * 100) / 75);
    deepWorkFactor = {
      name: "Plage de travail profond disponible",
      summary: "Journée pas encore commencée",
      cls: "neutral",
      rows: [],
    };
  } else {
    score = mt.score + tr.score + ot.score + dw.score;
    deepWorkFactor = dw.factor;
  }

  // Score label
  let scoreLabel: string;
  if (score >= 80) scoreLabel = "Bon suivi des facteurs de récupération";
  else if (score >= 50) scoreLabel = "Suivi modéré des facteurs de récupération";
  else scoreLabel = "Suivi faible des facteurs de récupération";

  const d = new Date(date);

  // Construit la liste des réunions avec leurs flags multi-tâche / transition,
  // destinée au rendu bordure colorée dans la timeline du TaskPane.
  const meetings: MeetingInfo[] = buildMeetingInfos(mt.trackedMeetings);

  return {
    date,
    dayLabel: formatDate(d),
    score,
    scoreLabel,
    factors: [mt.factor, tr.factor, ot.factor, deepWorkFactor],
    focusBlocks: dw.focusBlocks,
    overtimeEvents: ot.overtimeEvents,
    meetings,
  };
}

/**
 * Construit les MeetingInfo à partir des TrackedMeeting (qui portent déjà
 * mailsDuring) en recalculant le gap avant chaque réunion. La 1ère réunion
 * du jour est considérée transitionBeforeOk = true (pas de "avant").
 */
function buildMeetingInfos(tracked: TrackedMeeting[]): MeetingInfo[] {
  if (tracked.length === 0) return [];
  const sorted = [...tracked].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
  return sorted.map((m, i) => {
    let transitionBeforeOk = true;
    if (i > 0) {
      const prevEnd = sorted[i - 1].end;
      const gapBefore = (m.start.getTime() - prevEnd.getTime()) / 60000;
      transitionBeforeOk = gapBefore >= TRANSITION_MIN_GAP;
    }
    return {
      subject: m.subject,
      start: m.start,
      end: m.end,
      multitaskOk: m.mailsDuring === 0,
      transitionBeforeOk,
    };
  });
}
