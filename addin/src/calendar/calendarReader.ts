/**
 * Lit les données de récupération du jour depuis le calendrier "Gr33t Recovery"
 * via Microsoft Graph, en utilisant un access token MSAL-browser.
 *
 * Cible : le TaskPane. Le script demo-calendar.ts a déjà écrit les événements
 * (score all-day avec openTypeExtension, focus blocks, overtime).
 */
import type {
  DayRecoveryData,
  FocusBlock,
  MeetingInfo,
  OvertimeEvent,
} from "./types";
import { RECOVERY_EXTENSION_NAME } from "./graphClient";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const CALENDAR_NAME = "Gr33t Recovery";
const TIMEZONE = "Europe/Paris";

interface GraphEvent {
  id: string;
  subject: string;
  isAllDay: boolean;
  showAs: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  extensions?: Array<{
    extensionName?: string;
    payload?: string;
    [key: string]: unknown;
  }>;
}

interface GraphListResponse<T> {
  value: T[];
}

async function graphGet<T>(
  token: string,
  path: string
): Promise<T> {
  const url = path.startsWith("http") ? path : `${GRAPH_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      Prefer: `outlook.timezone="${TIMEZONE}"`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Graph ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/** Résout l'id du calendrier "Gr33t Recovery" (cache module-level). */
let cachedCalendarId: string | null = null;
async function resolveCalendarId(token: string): Promise<string | null> {
  if (cachedCalendarId) return cachedCalendarId;
  const data = await graphGet<GraphListResponse<{ id: string; name: string }>>(
    token,
    `/me/calendars?$filter=name eq '${CALENDAR_NAME}'`
  );
  if (!data.value || data.value.length === 0) return null;
  cachedCalendarId = data.value[0].id;
  return cachedCalendarId;
}

/** Format "YYYY-MM-DDT00:00:00" en heure locale pour un filtre Graph. */
function toLocalIsoDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
}

/**
 * Rehydrate un DayRecoveryData depuis la string JSON de l'extension.
 * Les champs Date dans focusBlocks/overtimeEvents sont reconstruits.
 */
function rehydrateRecoveryPayload(raw: string): DayRecoveryData {
  const parsed = JSON.parse(raw) as DayRecoveryData;
  const hydrate = <T extends { start: string | Date; end: string | Date }>(
    list: T[]
  ): T[] =>
    list.map((item) => ({
      ...item,
      start: new Date(item.start),
      end: new Date(item.end),
    }));
  return {
    ...parsed,
    focusBlocks: hydrate(parsed.focusBlocks as unknown as FocusBlock[]),
    overtimeEvents: hydrate(parsed.overtimeEvents as unknown as OvertimeEvent[]),
    meetings: parsed.meetings
      ? hydrate(parsed.meetings as unknown as MeetingInfo[])
      : [],
  };
}

/**
 * Récupère les données de récupération du jour courant depuis le calendrier Gr33t.
 *
 * @returns DayRecoveryData si un score all-day existe pour aujourd'hui, null sinon.
 */
export async function fetchTodayRecovery(
  token: string
): Promise<DayRecoveryData | null> {
  const calendarId = await resolveCalendarId(token);
  if (!calendarId) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const startFilter = toLocalIsoDate(today);
  const endFilter = toLocalIsoDate(tomorrow);

  // Fetch score all-day + extension en une seule requête
  const filter = `start/dateTime ge '${startFilter}' and start/dateTime lt '${endFilter}' and isAllDay eq true`;
  const expand = `extensions($filter=id eq '${RECOVERY_EXTENSION_NAME}')`;
  const path = `/me/calendars/${calendarId}/events?$filter=${encodeURIComponent(
    filter
  )}&$expand=${encodeURIComponent(expand)}&$top=5`;

  const resp = await graphGet<GraphListResponse<GraphEvent>>(token, path);
  const scoreEvent = resp.value.find((ev) => ev.isAllDay);
  if (!scoreEvent) return null;

  const ext = scoreEvent.extensions?.find(
    (e) => e.extensionName === RECOVERY_EXTENSION_NAME
  );
  if (ext?.payload && typeof ext.payload === "string") {
    try {
      return rehydrateRecoveryPayload(ext.payload);
    } catch (err) {
      console.warn("Failed to parse recovery extension payload:", err);
    }
  }

  // Fallback : aucune extension → reconstruire le minimum depuis le subject
  const scoreMatch = scoreEvent.subject.match(/(\d+)%/);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
  return {
    date: startFilter.split("T")[0],
    dayLabel: today.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    score,
    scoreLabel: "Données incomplètes — relance le script de peuplement",
    factors: [],
    focusBlocks: [],
    overtimeEvents: [],
  };
}
