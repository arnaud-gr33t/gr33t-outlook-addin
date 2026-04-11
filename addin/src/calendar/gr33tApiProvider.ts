/**
 * Gr33tApiProvider (Premium) — Stub.
 *
 * À implémenter quand l'API Gr33t exposera les endpoints nécessaires.
 * Pour l'instant, ce fichier définit le contrat et retourne une erreur.
 */
import type { DataProvider, DayRecoveryData } from "./types";

export class Gr33tApiProvider implements DataProvider {
  private apiBaseUrl: string;
  private apiToken: string;

  constructor(apiBaseUrl: string, apiToken: string) {
    this.apiBaseUrl = apiBaseUrl;
    this.apiToken = apiToken;
  }

  async getDayData(_date: string): Promise<DayRecoveryData | null> {
    throw new Error(
      "Gr33tApiProvider non implémenté. " +
      "L'API Gr33t doit exposer un endpoint GET /api/v1/recovery/{date} " +
      "retournant les scores et facteurs pré-calculés."
    );
  }

  async getWeekData(_mondayDate: string): Promise<(DayRecoveryData | null)[]> {
    throw new Error(
      "Gr33tApiProvider non implémenté. " +
      "L'API Gr33t doit exposer un endpoint GET /api/v1/recovery/week/{mondayDate}."
    );
  }
}
