/**
 * useGraphDashboard — orchestrateur de données v1.5.
 *
 * Fetch les 3 semaines (S-1, S, S+1) de l'utilisateur via Graph :
 *   - recovery data (scores + focus + overflows) depuis le calendrier
 *     "Gr33t Recovery" (déjà peuplé par demo-calendar.ts)
 *   - réunions futures depuis le calendrier principal /me/calendarView
 *
 * Les leviers, IRA et annotations restent en mock (mockData) en v1.5.
 *
 * États :
 *   - 'loading'     : fetch en cours
 *   - 'authRequired': pas encore connecté → afficher un bouton de login
 *   - 'error'       : échec réseau ou Graph → afficher le message
 *   - 'ready'       : `data` disponible
 */
import { useCallback, useEffect, useState } from "react";
import { fetchFutureMeetings, fetchWeekRecovery } from "../../../calendar/calendarReader";
import { clearTeamsToken, useTeamsToken } from "../../useTeamsToken";
import type { MeetingInfo } from "../../../calendar/types";
import {
  buildWeekFromRecovery,
  mergeFutureMeetings,
  mergeWithMock,
} from "./graph-adapter";
import { mockData } from "./mock-data";
import type { DashboardData, WeekData } from "../types/data-contract";

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
      const mondayCurrent = getMondayOf(today);
      const mondayPast = shiftDays(mondayCurrent, -7);
      const mondayNext = shiftDays(mondayCurrent, 7);
      const startFuture = toIso(today);
      const endFuture = toIso(shiftDays(mondayNext, 5)); // Lun → Ven S+1

      // Fetch parallèle : 3× recovery + 1× futur
      const [recPast, recCurrent, recNext, futureMap] = await Promise.all([
        fetchWeekRecovery(accessToken, toIso(mondayPast)),
        fetchWeekRecovery(accessToken, toIso(mondayCurrent)),
        fetchWeekRecovery(accessToken, toIso(mondayNext)),
        fetchFutureMeetings(accessToken, startFuture, endFuture),
      ]);

      const weekPast = buildWeekFromRecovery(
        {
          mondayIso: toIso(mondayPast),
          recoveries: recPast,
          kind: "past",
          score: mockData.weeks[0].score,
          weekNumber: getIsoWeek(mondayPast),
        },
        today
      );
      const weekCurrent = buildWeekFromRecovery(
        {
          mondayIso: toIso(mondayCurrent),
          recoveries: recCurrent,
          kind: "current",
          score: mockData.weeks[1].score,
          weekNumber: getIsoWeek(mondayCurrent),
        },
        today
      );
      const weekNext = buildWeekFromRecovery(
        {
          mondayIso: toIso(mondayNext),
          recoveries: recNext,
          kind: "future",
          score: mockData.weeks[2].score,
          weekNumber: getIsoWeek(mondayNext),
        },
        today
      );

      // Complète avec les réunions futures quand le jour n'a pas de recovery
      const enriched: [WeekData, WeekData, WeekData] = mergeFutureMeetings(
        [weekPast, weekCurrent, weekNext],
        futureMap as Map<string, MeetingInfo[]>,
        today
      );

      const merged = mergeWithMock(mockData, enriched, toIso(today));
      setData(merged);
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

  // Déclenche le fetch dès que l'auth est prête
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
