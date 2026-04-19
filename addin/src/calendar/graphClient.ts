/**
 * Client Microsoft Graph pour la gestion du calendrier Gr33t Recovery.
 */
import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import type { ScoreData, FocusBlock, OvertimeEvent } from "./demoData";
import { toDateTimeStr, toDayStr, nextDayStr, TIMEZONE } from "./demoData";
import { generateScoreHtml } from "./htmlBody";
import type { DayRecoveryData } from "./types";

const CALENDAR_NAME = "Gr33t Recovery";

/** Nom de l'openTypeExtension utilisée pour stocker le DayRecoveryData sur un score event. */
export const RECOVERY_EXTENSION_NAME = "com.gr33t.recovery";

/**
 * Formate une Date en chaîne locale "YYYY-MM-DDTHH:mm:ss" pour Graph API
 * (à utiliser conjointement avec un timeZone explicite).
 */
function toGraphDateTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Formate une Date en chaîne locale "YYYY-MM-DDT00:00:00" (minuit local).
 */
function toGraphDateMidnight(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
}

export function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * Trouve ou crée le calendrier "Gr33t Recovery".
 */
export async function getOrCreateCalendar(client: Client): Promise<string> {
  // Chercher un calendrier existant
  const existing = await client
    .api("/me/calendars")
    .filter(`name eq '${CALENDAR_NAME}'`)
    .get();

  if (existing.value && existing.value.length > 0) {
    console.log(`✓ Calendrier "${CALENDAR_NAME}" trouvé (id: ${existing.value[0].id})`);
    return existing.value[0].id;
  }

  // Créer le calendrier
  const created = await client.api("/me/calendars").post({
    name: CALENDAR_NAME,
    color: "lightGreen",
  });

  console.log(`✓ Calendrier "${CALENDAR_NAME}" créé (id: ${created.id})`);
  return created.id;
}

/**
 * Supprime tous les événements du calendrier Gr33t.
 */
export async function clearCalendarEvents(client: Client, calendarId: string): Promise<void> {
  const events = await client
    .api(`/me/calendars/${calendarId}/events`)
    .select("id")
    .top(200)
    .get();

  if (events.value && events.value.length > 0) {
    console.log(`  Suppression de ${events.value.length} événements existants...`);
    for (const ev of events.value) {
      await client.api(`/me/events/${ev.id}`).delete();
    }
    console.log(`✓ ${events.value.length} événements supprimés`);
  } else {
    console.log("  Aucun événement existant à supprimer");
  }
}

/**
 * Crée un événement score all-day (showAs: free).
 */
export async function createScoreEvent(
  client: Client,
  calendarId: string,
  data: ScoreData,
  dateOverride?: { start: Date; end: Date },
  recoveryPayload?: DayRecoveryData
): Promise<void> {
  const subject = `⚡ ${data.score}% de suivi des facteurs de récupération`;
  const bodyHtml = generateScoreHtml(data);

  const startStr = dateOverride
    ? toGraphDateMidnight(dateOverride.start)
    : toDayStr(data.dayOffset);
  const endStr = dateOverride
    ? toGraphDateMidnight(dateOverride.end)
    : nextDayStr(data.dayOffset);

  const eventBody: Record<string, unknown> = {
    subject,
    body: {
      contentType: "html",
      content: bodyHtml,
    },
    start: {
      dateTime: startStr,
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: endStr,
      timeZone: TIMEZONE,
    },
    isAllDay: true,
    showAs: "free",
    isReminderOn: false,
  };

  // Attache le DayRecoveryData structuré en openTypeExtension pour que le TaskPane
  // puisse le relire sans parser le HTML du body.
  if (recoveryPayload) {
    eventBody.extensions = [
      {
        "@odata.type": "microsoft.graph.openTypeExtension",
        extensionName: RECOVERY_EXTENSION_NAME,
        schemaVersion: 1,
        payload: JSON.stringify(recoveryPayload),
      },
    ];
  }

  await client.api(`/me/calendars/${calendarId}/events`).post(eventBody);

  console.log(
    `  ⚡ Score ${data.day}: ${data.score}%${recoveryPayload ? " (+ext)" : ""}`
  );
}

/**
 * Crée un événement focus (showAs: tentative).
 */
export async function createFocusEvent(
  client: Client,
  calendarId: string,
  block: FocusBlock,
  dateOverride?: { start: Date; end: Date }
): Promise<void> {
  const startStr = dateOverride
    ? toGraphDateTime(dateOverride.start)
    : toDateTimeStr(block.dayOffset, block.start);
  const endStr = dateOverride
    ? toGraphDateTime(dateOverride.end)
    : toDateTimeStr(block.dayOffset, block.end);

  await client.api(`/me/calendars/${calendarId}/events`).post({
    subject: `✅ Focus (${block.label})`,
    body: {
      contentType: "text",
      content: `Plage de travail profond disponible : ${block.label} sans réunion ni mail envoyé.`,
    },
    start: {
      dateTime: startStr,
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: endStr,
      timeZone: TIMEZONE,
    },
    showAs: "busy",
    isReminderOn: false,
  });

  console.log(`  ✅ Focus jour ${block.dayOffset}: ${block.label}`);
}

/**
 * Crée un événement overtime (showAs: oof).
 */
export async function createOvertimeEvent(
  client: Client,
  calendarId: string,
  event: OvertimeEvent,
  dateOverride?: { start: Date; end: Date }
): Promise<void> {
  const startStr = dateOverride
    ? toGraphDateTime(dateOverride.start)
    : toDateTimeStr(event.dayOffset, event.start);
  const endStr = dateOverride
    ? toGraphDateTime(dateOverride.end)
    : toDateTimeStr(event.dayOffset, event.end);

  await client.api(`/me/calendars/${calendarId}/events`).post({
    subject: `🌙 Hors plage — ${event.label}`,
    body: {
      contentType: "text",
      content: `Activité détectée hors de la plage de travail usuelle (8h-20h). Cela impacte le facteur Débordement de votre indice de récupération.`,
    },
    start: {
      dateTime: startStr,
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: endStr,
      timeZone: TIMEZONE,
    },
    showAs: "oof",
    isReminderOn: false,
  });

  console.log(`  🌙 Overtime jour ${event.dayOffset}: ${event.label}`);
}
