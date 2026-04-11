/**
 * Utilitaires pour la mini-timeline verticale du TaskPane Gr33t.
 *
 * Porté depuis mockup-D.html (fonctions hourToY, durationToH, scoreBand, fmtH).
 */
import type { ScoreBand } from "../types";

// ============================================================
// Constantes de la timeline
// ============================================================

/** Heure de début affichée sur la timeline (8h00). */
export const TL_START = 8;

/** Heure de fin affichée sur la timeline (21h00). */
export const TL_END = 21;

/** Hauteur totale de la timeline en pixels. */
export const TL_HEIGHT = 300;

/** Nombre d'heures couvertes (13h). */
export const TL_HOURS = TL_END - TL_START;

// ============================================================
// Calculs de positionnement
// ============================================================

/**
 * Convertit une heure décimale en position Y (pixels) sur la timeline.
 * @param h heure en décimal (ex: 9.75 = 9h45)
 * @returns position Y en pixels depuis le haut de la timeline
 */
export function hourToY(h: number): number {
  return ((h - TL_START) / TL_HOURS) * TL_HEIGHT;
}

/**
 * Calcule la hauteur en pixels d'une durée.
 * @param from heure de début en décimal
 * @param to heure de fin en décimal
 * @returns hauteur en pixels
 */
export function durationToH(from: number, to: number): number {
  return hourToY(to) - hourToY(from);
}

// ============================================================
// Couleurs sémantiques
// ============================================================

/**
 * Détermine la bande de couleur (good / warn / bad / future) pour un score.
 * @param score score sur 100, ou null pour "future"
 */
export function scoreBand(score: number | null): ScoreBand {
  if (score === null) return "future";
  if (score >= 80) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

// ============================================================
// Formatage
// ============================================================

/**
 * Formate une heure décimale en chaîne "HH:MM".
 * @param h heure en décimal (ex: 9.75 → "9:45")
 */
export function fmtH(h: number): string {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  return `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
}
