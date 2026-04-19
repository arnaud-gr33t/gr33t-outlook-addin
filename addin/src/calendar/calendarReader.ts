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
    // Inclut le path pour identifier quelle requête a échoué.
    throw new Error(
      `Graph ${res.status} ${res.statusText} on ${path.split("?")[0]}: ${text}`
    );
  }
  return res.json() as Promise<T>;
}

/** Résout l'id du calendrier "Gr33t Recovery" (cache module-level). */
let cachedCalendarId: string | null = null;
async function resolveCalendarId(token: string): Promise<string | null> {
  if (cachedCalendarId) return cachedCalendarId;
  // On fetch la liste complète plutôt que $filter=name eq '...' : le nom
  // contient un espace, Graph renvoie régulièrement 500 sur ce filter.
  const data = await graphGet<GraphListResponse<{ id: string; name: string }>>(
    token,
    `/me/calendars?$select=id,name&$top=50`
  );
  const match = (data.value ?? []).find((c) => c.name === CALENDAR_NAME);
  if (!match) return null;
  cachedCalendarId = match.id;
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

/**
 * Récupère les données d'une semaine complète (Lun → Ven) en une seule
 * requête Graph. Retourne un tableau de 5 éléments (null pour les jours
 * sans score event).
 *
 * @param mondayDate format ISO "YYYY-MM-DD" du lundi de la semaine
 */
export async function fetchWeekRecovery(
  token: string,
  mondayDate: string
): Promise<(DayRecoveryData | null)[]> {
  const calendarId = await resolveCalendarId(token);
  if (!calendarId) return [null, null, null, null, null];

  const [y, mo, d] = mondayDate.split("-").map(Number);
  const monday = new Date(y, mo - 1, d);
  const saturday = new Date(y, mo - 1, d + 5); // exclusif

  const startFilter = toLocalIsoDate(monday);
  const endFilter = toLocalIsoDate(saturday);

  // Fetch tous les score all-day de la semaine avec leur extension
  const filter = `start/dateTime ge '${startFilter}' and start/dateTime lt '${endFilter}' and isAllDay eq true`;
  const expand = `extensions($filter=id eq '${RECOVERY_EXTENSION_NAME}')`;
  const path = `/me/calendars/${calendarId}/events?$filter=${encodeURIComponent(
    filter
  )}&$expand=${encodeURIComponent(expand)}&$top=20&$orderby=start/dateTime`;

  const resp = await graphGet<GraphListResponse<GraphEvent>>(token, path);

  // Indexer par date (YYYY-MM-DD) extraite de start.dateTime
  const byDate = new Map<string, GraphEvent>();
  for (const ev of resp.value) {
    if (!ev.isAllDay) continue;
    const dateStr = ev.start.dateTime.split("T")[0];
    byDate.set(dateStr, ev);
  }

  // Pour chaque jour Lun-Ven, tenter de hydrate l'extension
  const results: (DayRecoveryData | null)[] = [];
  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(y, mo - 1, d + i);
    const dayStr = toLocalIsoDate(dayDate).split("T")[0];
    const ev = byDate.get(dayStr);
    if (!ev) {
      results.push(null);
      continue;
    }
    const ext = ev.extensions?.find(
      (e) => e.extensionName === RECOVERY_EXTENSION_NAME
    );
    if (ext?.payload && typeof ext.payload === "string") {
      try {
        results.push(rehydrateRecoveryPayload(ext.payload));
        continue;
      } catch (err) {
        console.warn(`Failed to parse payload for ${dayStr}:`, err);
      }
    }
    // Fallback minimal depuis le subject
    const scoreMatch = ev.subject.match(/(\d+)%/);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
    results.push({
      date: dayStr,
      dayLabel: dayDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      score,
      scoreLabel: "Données incomplètes — relance le script de peuplement",
      factors: [],
      focusBlocks: [],
      overtimeEvents: [],
    });
  }
  return results;
}

// ============================================================
// Fetch des réunions futures (calendrier principal)
// Utilisé par le dashboard Rythme pour afficher les réunions planifiées
// de la semaine courante et de la semaine suivante, en complément des
// scores DayRecoveryData (qui ne sont écrits que pour les jours passés).
// ============================================================

/**
 * Récupère les réunions de l'utilisateur entre `startIso` (inclusif) et
 * `endIso` (exclusif), depuis le calendrier principal (pas Gr33t Recovery).
 * Retourne une Map indexée par date ISO → liste de MeetingInfo.
 *
 * Les métadonnées `multitaskOk` / `transitionBeforeOk` ne sont pas calculées
 * (elles nécessitent des données mail + contexte). On les laisse à `true` par
 * défaut — pour le rendu timeline du dashboard, l'important est la bonne
 * position et le flag `future` que l'adapter calcule lui-même.
 *
 * @param startIso Date ISO "YYYY-MM-DD" de début (inclusif)
 * @param endIso Date ISO "YYYY-MM-DD" de fin (exclusif)
 */
export async function fetchFutureMeetings(
  token: string,
  startIso: string,
  endIso: string
): Promise<Map<string, MeetingInfo[]>> {
  // NB: sur /me/calendarView, startDateTime/endDateTime définissent déjà la
  // plage — pas besoin de $filter redondant (Graph renvoie 500 si on l'ajoute).
  // On filtre isAllDay/showAs/isCancelled côté client.
  const select = "subject,start,end,showAs,isCancelled,isAllDay";
  const path =
    `/me/calendarView?startDateTime=${startIso}T00:00:00` +
    `&endDateTime=${endIso}T00:00:00` +
    `&$select=${select}` +
    `&$top=200`;

  const resp = await graphGet<
    GraphListResponse<GraphEvent & { isCancelled?: boolean }>
  >(token, path);

  const byDate = new Map<string, MeetingInfo[]>();
  for (const ev of resp.value) {
    if (ev.isAllDay) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((ev as any).isCancelled) continue;
    // Filtrage showAs : on ignore "free" (plages persos non-bloquantes)
    if (ev.showAs === "free") continue;

    const start = new Date(ev.start.dateTime);
    const end = new Date(ev.end.dateTime);
    const dateKey = ev.start.dateTime.split("T")[0];
    const info: MeetingInfo = {
      subject: ev.subject || "(sans titre)",
      start,
      end,
      // Par défaut optimiste : on ne peut pas calculer ces champs sans
      // accès aux mails/chats envoyés pendant la réunion.
      multitaskOk: true,
      transitionBeforeOk: true,
    };
    const list = byDate.get(dateKey) ?? [];
    list.push(info);
    byDate.set(dateKey, list);
  }
  return byDate;
}

// ============================================================
// Fetch des envois de mail sur une période (headers uniquement)
// Utilisé par le scoring IRA pour détecter les envois qui :
//   - interrompent les plages de concentration
//   - sortent de la plage horaire usuelle 8h-18h30 (Horaires)
//   - surviennent pendant une réunion (Focus)
// ============================================================

/** Un envoi de mail — headers uniquement, jamais le contenu. */
export interface SentMail {
  /** Horodatage d'envoi (sentDateTime Graph). */
  sentAt: Date;
}

/**
 * Récupère tous les mails envoyés par l'utilisateur sur [startIso, endIso[.
 * Scope requis : `Mail.ReadBasic`.
 *
 * Utilise le dossier SentItems (well-known) filtré par sentDateTime.
 *
 * @param startIso Date ISO "YYYY-MM-DD" (inclusif)
 * @param endIso   Date ISO "YYYY-MM-DD" (exclusif)
 */
export async function fetchSentMails(
  token: string,
  startIso: string,
  endIso: string
): Promise<SentMail[]> {
  const filter = `sentDateTime ge ${startIso}T00:00:00Z and sentDateTime lt ${endIso}T00:00:00Z`;
  const select = "sentDateTime";
  const path =
    `/me/mailFolders/SentItems/messages` +
    `?$filter=${encodeURIComponent(filter)}` +
    `&$select=${select}` +
    `&$top=500&$orderby=sentDateTime`;

  interface SentPage {
    value: Array<{ sentDateTime: string }>;
    "@odata.nextLink"?: string;
  }

  const all: SentMail[] = [];
  // Pagination simple via @odata.nextLink
  let next: string | null = path;
  let guard = 0;
  while (next && guard < 10) {
    guard++;
    const resp: SentPage = await graphGet<SentPage>(token, next);
    for (const m of resp.value) {
      if (!m.sentDateTime) continue;
      all.push({ sentAt: new Date(m.sentDateTime) });
    }
    next = resp["@odata.nextLink"] ?? null;
  }
  return all;
}
