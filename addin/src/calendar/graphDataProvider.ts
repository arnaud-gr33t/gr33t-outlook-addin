/**
 * GraphDataProvider (Solo) — Récupère les données depuis Microsoft Graph
 * et calcule les scores de récupération localement.
 */
import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import type {
  DataProvider,
  DayRecoveryData,
  RawCalendarEvent,
  RawSentMail,
} from "./types";
import { calculateDayRecovery } from "./scoreCalculator";

/**
 * Fuseau horaire utilisé pour toutes les requêtes Graph.
 * Le header `Prefer: outlook.timezone` force Graph à renvoyer les dateTimes
 * dans ce fuseau (au lieu du fuseau de création de chaque événement),
 * ce qui évite les décalages quand scoreCalculator fait new Date(dateTime).
 */
const DEFAULT_TIMEZONE = "Europe/Paris";

export class GraphDataProvider implements DataProvider {
  private client: Client;
  private userEmail: string;

  constructor(accessToken: string, userEmail: string) {
    this.client = Client.init({
      authProvider: (done) => done(null, accessToken),
    });
    this.userEmail = userEmail;
  }

  /**
   * Récupère les événements calendrier d'une journée.
   */
  private async getCalendarEvents(date: string): Promise<RawCalendarEvent[]> {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const response = await this.client
      .api("/me/calendar/events")
      .header("Prefer", `outlook.timezone="${DEFAULT_TIMEZONE}"`)
      .filter(
        `start/dateTime ge '${startOfDay}' and end/dateTime le '${endOfDay}'`
      )
      .select("id,subject,start,end,attendees,responseStatus,isAllDay,showAs,organizer")
      .top(100)
      .get();

    return response.value || [];
  }

  /**
   * Récupère les mails envoyés d'une journée.
   */
  private async getSentMails(date: string): Promise<RawSentMail[]> {
    const startOfDay = `${date}T00:00:00Z`;
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const endOfDay = `${nextDay.toISOString().split("T")[0]}T00:00:00Z`;

    const response = await this.client
      .api("/me/mailFolders/sentItems/messages")
      .header("Prefer", `outlook.timezone="${DEFAULT_TIMEZONE}"`)
      .filter(
        `sentDateTime ge ${startOfDay} and sentDateTime lt ${endOfDay}`
      )
      .select("sentDateTime")
      .top(200)
      .get();

    return response.value || [];
  }

  /**
   * Récupère et calcule les données de récupération pour un jour.
   */
  async getDayData(date: string): Promise<DayRecoveryData | null> {
    try {
      console.log(`  📅 Récupération des données pour ${date}...`);

      const [events, mails] = await Promise.all([
        this.getCalendarEvents(date),
        this.getSentMails(date),
      ]);

      console.log(`     ${events.length} événements, ${mails.length} mails envoyés`);

      if (events.length === 0 && mails.length === 0) {
        console.log(`     Pas de données pour ${date}`);
        return null;
      }

      const data = calculateDayRecovery(date, events, mails, this.userEmail);
      console.log(`     Score: ${data.score}% (${data.scoreLabel})`);

      return data;
    } catch (err) {
      console.error(`  ❌ Erreur pour ${date}:`, (err as Error).message);
      return null;
    }
  }

  /**
   * Récupère les données pour une semaine de travail (Lun-Ven).
   */
  async getWeekData(mondayDate: string): Promise<(DayRecoveryData | null)[]> {
    const results: (DayRecoveryData | null)[] = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(mondayDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      // Ne pas calculer les jours strictement futurs (après aujourd'hui).
      // Aujourd'hui est inclus pour que le TaskPane puisse afficher les données
      // partielles du jour en cours.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      if (dayStart.getTime() > today.getTime()) {
        console.log(`  ⏭  ${dateStr} — jour futur, ignoré`);
        results.push(null);
        continue;
      }

      const data = await this.getDayData(dateStr);
      results.push(data);
    }

    return results;
  }
}
