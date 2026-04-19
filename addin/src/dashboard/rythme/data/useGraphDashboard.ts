/**
 * useGraphDashboard — orchestrateur de données (v1.1 IRA dynamique).
 *
 * Fetch :
 *   - Réunions sur 30 jours (calendrier principal) via /me/calendarView
 *   - Envois mail sur 30 jours via /me/mailFolders/SentItems/messages
 *
 * Calcule ensuite :
 *   - Score journalier des 4 facteurs + IRA pour chaque jour
 *   - IRA 30j + delta 7j (carte IRA)
 *   - Leviers (moyennes 30j des 4 facteurs)
 *   - Score hebdo S-1 (moyenne lun-ven)
 *   - Nb réunions planifiées S+1 (header futur)
 *
 * Les annotations restent mockées (détection de patterns = chantier v2+).
 */
import { useCallback, useEffect, useState } from "react";
import {
  fetchFutureMeetings,
  fetchSentMails,
} from "../../../calendar/calendarReader";
import { clearTeamsToken, useTeamsToken } from "../../useTeamsToken";
import type { MeetingInfo } from "../../../calendar/types";
import { mockData } from "./mock-data";
import type {
  DashboardData,
  DayData,
  Levier,
  WeekData,
  WeekScore,
} from "../types/data-contract";
import {
  computeDailyScores,
  type DailyMeeting,
  type DailyScores,
} from "../scoring/daily";
import {
  iraLabel,
  rolling30DaysScores,
  irra30DaysDelta,
  weeklyScores,
} from "../scoring/aggregate";

export type DashboardStatus =
  | "loading"
  | "authRequired"
  | "ready"
  | "error";

export interface UseGraphDashboardResult {
  status: DashboardStatus;
  data: DashboardData | null;
  error: string | null;
  signIn: () => Promise<void>;
  retry: () => void;
}

// ============================================================
// Helpers dates
// ============================================================
function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function getMondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}
function shiftDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(d.getDate() + days);
  return r;
}
function getIsoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ============================================================
// Types Graph locaux (réunions 30j) — on les lit directement depuis
// /me/calendarView avec attendees + participants.
// ============================================================

interface RawMeeting {
  start: Date;
  end: Date;
  subject: string;
  showAs: string;
  isAllDay: boolean;
  isCancelled?: boolean;
  otherAttendees: number;
}

async function fetchMeetings(
  token: string,
  startIso: string,
  endIso: string
): Promise<RawMeeting[]> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView` +
      `?startDateTime=${startIso}T00:00:00` +
      `&endDateTime=${endIso}T00:00:00` +
      `&$select=subject,start,end,showAs,isAllDay,isCancelled,attendees` +
      `&$top=500`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        Prefer: `outlook.timezone="Europe/Paris"`,
      },
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Graph ${res.status} ${res.statusText} on /me/calendarView (30j): ${text}`
    );
  }
  const json = (await res.json()) as {
    value: Array<{
      subject?: string;
      showAs?: string;
      isAllDay?: boolean;
      isCancelled?: boolean;
      start: { dateTime: string };
      end: { dateTime: string };
      attendees?: Array<{ emailAddress?: { address?: string } }>;
    }>;
  };
  return json.value
    .filter((ev) => !ev.isCancelled && !ev.isAllDay)
    .map((ev) => ({
      start: new Date(ev.start.dateTime),
      end: new Date(ev.end.dateTime),
      subject: ev.subject ?? "(sans titre)",
      showAs: ev.showAs ?? "busy",
      isAllDay: false,
      isCancelled: false,
      otherAttendees: ev.attendees?.length ?? 0,
    }));
}

// ============================================================
// Groupe les données brutes par jour (clé ISO "YYYY-MM-DD")
// ============================================================
function groupByDate<T>(
  items: T[],
  getDate: (it: T) => Date
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const d = getDate(item);
    const key = toIso(d);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

// ============================================================
// Construction d'un WeekData à partir de réunions brutes (Graph)
// ============================================================
const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function meetingToRythmeMeeting(m: RawMeeting, now: Date): DayData["meetings"][number] {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmt = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {
    start: fmt(m.start),
    end: fmt(m.end),
    title: m.subject,
    trans: "ok", // pas de calcul trans/multi ici (info d'affichage),
    multi: 0, //     l'agrégation 30j exploite les RawMeetings complets
    future: m.start.getTime() > now.getTime() ? true : undefined,
  };
}

function buildEmptyDay(isoDate: string, today: Date): DayData {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    date: isoDate,
    shortLabel: WEEKDAY_SHORT[date.getDay()],
    dayNumber: date.getDate(),
    isToday:
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate(),
    meetings: [],
    focusBands: [],
    overflows: [],
  };
}

function buildWeekData(
  mondayIso: string,
  kind: WeekData["kind"],
  score: WeekScore | null,
  meetingsByDate: Map<string, RawMeeting[]>,
  today: Date
): WeekData {
  const [y, m, d] = mondayIso.split("-").map(Number);
  const days: DayData[] = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(y, m - 1, d + i);
    const iso = toIso(date);
    const dayMeetings = meetingsByDate.get(iso) ?? [];
    days.push({
      ...buildEmptyDay(iso, today),
      meetings: dayMeetings.map((mm) => meetingToRythmeMeeting(mm, today)),
    });
  }
  return {
    weekNumber: getIsoWeek(new Date(y, m - 1, d)),
    mondayDate: mondayIso,
    kind,
    score,
    days: days as WeekData["days"],
  };
}

// ============================================================
// Construit les 4 leviers depuis les moyennes 30j
// ============================================================
function buildLeviers(
  pct: { transitions: number; concentration: number; horaires: number; focus: number }
): [Levier, Levier, Levier, Levier] {
  return [
    {
      id: "transitions",
      positive: { ...mockData.leviers[0].positive, percent: pct.transitions },
      negative: { ...mockData.leviers[0].negative, percent: 100 - pct.transitions },
    },
    {
      id: "concentration",
      positive: { ...mockData.leviers[1].positive, percent: pct.concentration },
      negative: { ...mockData.leviers[1].negative, percent: 100 - pct.concentration },
    },
    {
      id: "horaires",
      positive: { ...mockData.leviers[2].positive, percent: pct.horaires },
      negative: { ...mockData.leviers[2].negative, percent: 100 - pct.horaires },
    },
    {
      id: "focus_reunion",
      positive: { ...mockData.leviers[3].positive, percent: pct.focus },
      negative: { ...mockData.leviers[3].negative, percent: 100 - pct.focus },
    },
  ];
}

// ============================================================
// Hook principal
// ============================================================

export function useGraphDashboard(): UseGraphDashboardResult {
  const auth = useTeamsToken();
  const [status, setStatus] = useState<DashboardStatus>("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (accessToken: string): Promise<void> => {
    setStatus("loading");
    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Bornes : 30 jours passés (pour IRA 30j + leviers) + 2 semaines futures
      // (pour compter les réunions S+1)
      const past30Start = shiftDays(today, -30);
      const futureEnd = shiftDays(today, 21); // couvre S+1 et marge

      // Fetch parallèle : réunions sur 51 jours + envois sur 30 jours
      const [meetings, sends, futureMeetingsMap] = await Promise.all([
        fetchMeetings(token_(accessToken), toIso(past30Start), toIso(futureEnd)),
        fetchSentMails(accessToken, toIso(past30Start), toIso(today)),
        fetchFutureMeetings(accessToken, toIso(today), toIso(futureEnd)),
      ]);

      // Indexation par jour
      const meetingsByDate = groupByDate(meetings, (m) => m.start);
      const sendsByDate = groupByDate(sends, (s) => s.sentAt);

      // Calcul des scores journaliers sur les 30 derniers jours calendaires
      const scoresByDate = new Map<string, DailyScores>();
      for (let offset = 1; offset <= 30; offset++) {
        const d = shiftDays(today, -offset);
        const iso = toIso(d);
        const m = (meetingsByDate.get(iso) ?? []).map<DailyMeeting>((mm) => ({
          start: mm.start,
          end: mm.end,
          otherAttendees: mm.otherAttendees,
        }));
        const s = (sendsByDate.get(iso) ?? []).map((x) => ({ sentAt: x.sentAt }));
        scoresByDate.set(iso, computeDailyScores({ date: d, meetings: m, sends: s }));
      }

      // IRA 30j + delta
      const agg30 = rolling30DaysScores(today, scoresByDate);
      const delta = irra30DaysDelta(today, scoresByDate);

      // Scores hebdo
      const mondayCurrent = getMondayOf(today);
      const mondayPast = shiftDays(mondayCurrent, -7);
      const mondayNext = shiftDays(mondayCurrent, 7);
      const weekPastAgg = weeklyScores(toIso(mondayPast), scoresByDate);

      // Comptage réunions planifiées S+1
      let countNextWeek = 0;
      for (let i = 0; i < 5; i++) {
        const d = shiftDays(mondayNext, i);
        const iso = toIso(d);
        const list = futureMeetingsMap.get(iso) as MeetingInfo[] | undefined;
        if (list) countNextWeek += list.length;
      }

      // Construction des 3 weeks (avec réunions rendues dans la timeline)
      const weekPast = buildWeekData(
        toIso(mondayPast),
        "past",
        weekPastAgg
          ? { value: weekPastAgg.ira, kind: "value", label: "IRA S-1" }
          : null,
        meetingsByDate,
        today
      );
      const weekCurrent = buildWeekData(
        toIso(mondayCurrent),
        "current",
        delta !== null
          ? { value: delta, kind: "delta", label: "vs S-1" }
          : null,
        meetingsByDate,
        today
      );

      // Semaine future : on utilise futureMeetingsMap (réunions planifiées)
      const futureMeetingsAsRaw = new Map<string, RawMeeting[]>();
      for (const [iso, list] of futureMeetingsMap.entries()) {
        futureMeetingsAsRaw.set(
          iso,
          list.map((fm) => ({
            start: fm.start,
            end: fm.end,
            subject: fm.subject,
            showAs: "busy",
            isAllDay: false,
            isCancelled: false,
            otherAttendees: 1,
          }))
        );
      }
      const weekNext = buildWeekData(
        toIso(mondayNext),
        "future",
        { value: countNextWeek, kind: "count", label: "Réunions" },
        futureMeetingsAsRaw,
        today
      );

      // Assemblage final
      const ira = agg30
        ? {
            value: agg30.ira,
            label: iraLabel(agg30.ira),
            delta: delta ?? 0,
          }
        : mockData.ira;

      const leviers = agg30
        ? buildLeviers({
            transitions: agg30.transitions,
            concentration: agg30.concentration,
            horaires: agg30.horaires,
            focus: agg30.focus,
          })
        : mockData.leviers;

      const dashboard: DashboardData = {
        ...mockData,
        referenceDate: toIso(today),
        weeks: [weekPast, weekCurrent, weekNext],
        ira,
        leviers,
      };

      setData(dashboard);
      setStatus("ready");
    } catch (err) {
      const msg = (err as Error).message || String(err);
      if (msg.includes("401") || /Unauthorized/i.test(msg)) {
        clearTeamsToken();
        setStatus("authRequired");
      } else {
        setError(msg);
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    if (auth.status === "ready" && auth.token) {
      void fetchAll(auth.token);
    } else if (auth.status === "authRequired") {
      setStatus("authRequired");
    } else if (auth.status === "error") {
      setError(auth.error);
      setStatus("error");
    } else {
      setStatus("loading");
    }
  }, [auth.status, auth.token, auth.error, fetchAll]);

  const retry = useCallback(() => {
    setError(null);
    auth.retry();
  }, [auth]);

  return {
    status,
    data,
    error,
    signIn: auth.signIn,
    retry,
  };
}

// Helper identité pour visibilité — on garde pour refactor futur vers une
// couche Graph client dédiée.
function token_(t: string): string {
  return t;
}
