/**
 * Script Gr33t Calendar Overlay — Crée/met à jour le calendrier "Gr33t Recovery"
 * dans Outlook via Microsoft Graph API.
 *
 * Usage :
 *   npx tsx scripts/demo-calendar.ts                  # mode demo (par défaut)
 *   npx tsx scripts/demo-calendar.ts --mode=demo      # données mock
 *   npx tsx scripts/demo-calendar.ts --mode=solo      # vraies données via Graph
 *   npx tsx scripts/demo-calendar.ts --mode=premium   # API Gr33t (pas encore implémenté)
 *
 * Options :
 *   --week=2026-04-06   # date du lundi (défaut: semaine courante ou semaine précédente)
 */
import { PublicClientApplication, DeviceCodeRequest } from "@azure/msal-node";
import {
  createGraphClient,
  getOrCreateCalendar,
  clearCalendarEvents,
  createScoreEvent,
  createFocusEvent,
  createOvertimeEvent,
} from "../src/calendar/graphClient";
import { scoreData, focusBlocks, overtimeEvents } from "../src/calendar/demoData";
import { GraphDataProvider } from "../src/calendar/graphDataProvider";
import { Gr33tApiProvider } from "../src/calendar/gr33tApiProvider";
import type { DataProvider, DayRecoveryData } from "../src/calendar/types";
import type { ScoreData, FocusBlock as DemoFocusBlock, OvertimeEvent as DemoOvertimeEvent } from "../src/calendar/demoData";

// ============================================================
// CONFIGURATION
// ============================================================
const CLIENT_ID = process.env.GR33T_CLIENT_ID || "db7277cc-f16f-4739-9358-33fc327bcd28";
const TENANT_ID = process.env.GR33T_TENANT_ID || "7ea6c456-b138-449f-a20e-1b11403d7a6b";

// ============================================================
// PARSE ARGS
// ============================================================
function parseArgs() {
  const args = process.argv.slice(2);
  let mode = "demo";
  let week: string | undefined;

  for (const arg of args) {
    if (arg.startsWith("--mode=")) mode = arg.split("=")[1];
    if (arg.startsWith("--week=")) week = arg.split("=")[1];
  }

  // Default week: previous Monday
  if (!week) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset - 7); // previous week
    week = monday.toISOString().split("T")[0];
  }

  return { mode, week };
}

// ============================================================
// SCOPES
// ============================================================
function getScopes(mode: string): string[] {
  switch (mode) {
    case "solo":
      return ["Calendars.ReadWrite", "Mail.ReadBasic"];
    case "premium":
      return ["Calendars.ReadWrite"];
    default:
      return ["Calendars.ReadWrite"];
  }
}

// ============================================================
// AUTHENTICATE
// ============================================================
async function authenticate(scopes: string[]) {
  const pca = new PublicClientApplication({
    auth: {
      clientId: CLIENT_ID,
      authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    },
  });

  const request: DeviceCodeRequest = {
    scopes,
    deviceCodeCallback: (response) => {
      console.log();
      console.log("┌─────────────────────────────────────────────────┐");
      console.log("│  Ouvrez votre navigateur et allez sur :         │");
      console.log(`│  ${response.verificationUri.padEnd(47)}│`);
      console.log(`│  Entrez le code : ${response.userCode.padEnd(30)}│`);
      console.log("└─────────────────────────────────────────────────┘");
      console.log();
    },
  };

  const tokenResponse = await pca.acquireTokenByDeviceCode(request);
  if (!tokenResponse?.accessToken) throw new Error("Pas de token reçu");

  return {
    accessToken: tokenResponse.accessToken,
    userEmail: tokenResponse.account?.username || "",
  };
}

// ============================================================
// MODE DEMO — données mock
// ============================================================
async function runDemo(accessToken: string, weekDate: string) {
  const client = createGraphClient(accessToken);
  const calendarId = await getOrCreateCalendar(client);
  console.log();

  console.log("3. Nettoyage des événements existants...");
  await clearCalendarEvents(client, calendarId);
  console.log();

  console.log("4. Création des événements Score (all-day)...");
  for (const data of scoreData) {
    await createScoreEvent(client, calendarId, data);
  }
  console.log();

  console.log("5. Création des événements Focus...");
  for (const block of focusBlocks) {
    await createFocusEvent(client, calendarId, block);
  }
  console.log();

  console.log("6. Création des événements Overtime...");
  for (const event of overtimeEvents) {
    await createOvertimeEvent(client, calendarId, event);
  }

  return scoreData.length + focusBlocks.length + overtimeEvents.length;
}

// ============================================================
// MODE SOLO / PREMIUM — vraies données
// ============================================================
async function runWithProvider(
  accessToken: string,
  provider: DataProvider,
  weekDate: string
) {
  const client = createGraphClient(accessToken);
  const calendarId = await getOrCreateCalendar(client);
  console.log();

  console.log("3. Nettoyage des événements existants...");
  await clearCalendarEvents(client, calendarId);
  console.log();

  console.log(`4. Récupération des données (semaine du ${weekDate})...`);
  const weekData = await provider.getWeekData(weekDate);
  console.log();

  let totalEvents = 0;

  console.log("5. Création des événements...");
  // Parse week Monday as local date (YYYY-MM-DD → local midnight)
  const [wy, wm, wd] = weekDate.split("-").map(Number);

  for (let i = 0; i < weekData.length; i++) {
    const day = weekData[i];
    if (!day) {
      console.log(`  ⏭  Jour ${i} — pas de données`);
      continue;
    }

    // Real date for this day (Monday + i)
    const dayStart = new Date(wy, wm - 1, wd + i);
    const dayEnd = new Date(wy, wm - 1, wd + i + 1);

    // Score all-day
    const scoreEventData: ScoreData = {
      day: day.dayLabel,
      dayOffset: i,
      score: day.score,
      label: day.scoreLabel,
      factors: day.factors.map((f) => ({
        name: f.name,
        summary: f.summary,
        cls: f.cls,
        rows: f.rows,
      })),
    };
    await createScoreEvent(
      client,
      calendarId,
      scoreEventData,
      { start: dayStart, end: dayEnd },
      day
    );
    totalEvents++;

    // Focus blocks — use real Date objects from DayRecoveryData
    for (const block of day.focusBlocks) {
      const demoBlock: DemoFocusBlock = {
        dayOffset: i,
        start: block.start.getHours() + block.start.getMinutes() / 60,
        end: block.end.getHours() + block.end.getMinutes() / 60,
        label: block.label,
      };
      await createFocusEvent(client, calendarId, demoBlock, {
        start: block.start,
        end: block.end,
      });
      totalEvents++;
    }

    // Overtime — use real Date objects from DayRecoveryData
    for (const ot of day.overtimeEvents) {
      const demoOt: DemoOvertimeEvent = {
        dayOffset: i,
        start: ot.start.getHours() + ot.start.getMinutes() / 60,
        end: ot.end.getHours() + ot.end.getMinutes() / 60,
        label: ot.label,
      };
      await createOvertimeEvent(client, calendarId, demoOt, {
        start: ot.start,
        end: ot.end,
      });
      totalEvents++;
    }
  }

  return totalEvents;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const { mode, week } = parseArgs();

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Gr33t Recovery — Calendrier Overlay     ║");
  console.log(`║   Mode: ${mode.padEnd(33)}║`);
  console.log(`║   Semaine: ${week.padEnd(31)}║`);
  console.log("╚══════════════════════════════════════════╝");
  console.log();

  // 1. Auth
  console.log("1. Authentification...");
  const scopes = getScopes(mode);
  const { accessToken, userEmail } = await authenticate(scopes);
  console.log(`✓ Authentifié en tant que ${userEmail}`);
  console.log();

  // 2. Run
  console.log("2. Calendrier Gr33t Recovery...");
  let totalEvents: number;

  switch (mode) {
    case "demo":
      totalEvents = await runDemo(accessToken, week);
      break;

    case "solo": {
      const graphProvider = new GraphDataProvider(accessToken, userEmail);
      totalEvents = await runWithProvider(accessToken, graphProvider, week);
      break;
    }

    case "premium": {
      const apiUrl = process.env.GR33T_API_URL || "https://api.gr33t.fr";
      const apiToken = process.env.GR33T_API_TOKEN || "";
      const gr33tProvider = new Gr33tApiProvider(apiUrl, apiToken);
      totalEvents = await runWithProvider(accessToken, gr33tProvider, week);
      break;
    }

    default:
      console.error(`❌ Mode inconnu: ${mode}. Utilisez demo, solo ou premium.`);
      process.exit(1);
  }

  console.log();
  console.log("╔══════════════════════════════════════════╗");
  console.log(`║  ✅ ${totalEvents.toString().padEnd(3)} événements créés avec succès    ║`);
  console.log("║                                          ║");
  console.log("║  Ouvrez Outlook Web → vue Calendrier     ║");
  console.log("║  Le calendrier 'Gr33t Recovery' est      ║");
  console.log("║  visible dans 'Mes calendriers'          ║");
  console.log("╚══════════════════════════════════════════╝");
}

main().catch((err) => {
  console.error("❌ Erreur:", err.message || err);
  process.exit(1);
});
