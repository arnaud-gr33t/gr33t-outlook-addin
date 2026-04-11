/**
 * Données mockées pour le Jalon 1.
 *
 * Portées depuis mockup-D.html (dayData + tlData) et fusionnées en WeekData typée.
 * Elles seront remplacées par des appels Microsoft Graph + ScoreCalculator en Phase 5-6.
 */
import type { WeekData } from "../types";

export const mockWeekData: WeekData = [
  // ============================================================
  // Lundi 6 avril — Score 65
  // ============================================================
  {
    score: {
      dayLabel: "Lundi 6 avril",
      weekday: "Lun",
      dayNum: "6",
      score: 65,
      scoreLabel: "Suivi modéré des facteurs de récupération",
      factors: [
        {
          type: "multitask",
          name: "Multi-tâche",
          summary: "0/2 réunions",
          summaryClass: "bad",
          rows: [
            { label: "10:00–11:00 Comité Produit", status: "1 mail", statusClass: "nok" },
            { label: "14:00–15:00 Sync Ops", status: "0", statusClass: "ok" },
          ],
          more: null,
        },
        {
          type: "transitions",
          name: "Transitions",
          summary: "1/2 réunions",
          summaryClass: "warn",
          rows: [
            { label: "9:45 → 10:00 Comité Produit", status: "15 min", statusClass: "alert" },
            { label: "11:00 → 14:00 Sync Ops", status: "ok", statusClass: "ok" },
          ],
          more: null,
        },
        {
          type: "debordement",
          name: "Débordement",
          summary: "1 mail hors plage",
          summaryClass: "bad",
          rows: [{ label: "Mail envoyé à 21:15", status: "⚠", statusClass: "alert" }],
          more: null,
        },
        {
          type: "deepwork",
          name: "Plage de travail profond",
          summary: "3 blocs · 6h15",
          summaryClass: "neutral",
          rows: [
            { label: "08:00–09:00 (60 min)", status: "✓", statusClass: "ok" },
            { label: "11:00–14:00 (150 min)", status: "✓", statusClass: "ok" },
          ],
          more: "+ 1 autre...",
        },
      ],
    },
    timeline: {
      events: [
        { start: 9, end: 9.75, name: "Standup", variant: "blue" },
        { start: 10, end: 11, name: "Comité Produit", variant: "purple" },
        { start: 14, end: 15, name: "Sync Ops", variant: "teal" },
      ],
      overlays: {
        multitask: [{ start: 10, end: 11, label: "1 mail" }],
        transitions: [{ start: 9.75, end: 10, label: "15 min" }],
        debordement: [{ start: 20, end: 21.25, label: "Mail 21:15" }],
        deepwork: [
          { start: 8, end: 9, label: "1h" },
          { start: 11, end: 12.5, label: "1h30" },
          { start: 13.5, end: 14, label: "30 min" },
          { start: 15, end: 20, label: "5h" },
        ],
      },
    },
  },

  // ============================================================
  // Mardi 7 avril — Score 72
  // ============================================================
  {
    score: {
      dayLabel: "Mardi 7 avril",
      weekday: "Mar",
      dayNum: "7",
      score: 72,
      scoreLabel: "Suivi modéré des facteurs de récupération",
      factors: [
        {
          type: "multitask",
          name: "Multi-tâche",
          summary: "1/3 réunions",
          summaryClass: "warn",
          rows: [
            { label: "9:00–10:00 Comité Direction", status: "0", statusClass: "ok" },
            { label: "10:00–10:30 Point Produit", status: "2 mails", statusClass: "nok" },
          ],
          more: "+ 1 autre...",
        },
        {
          type: "transitions",
          name: "Transitions",
          summary: "2/3 réunions",
          summaryClass: "warn",
          rows: [
            { label: "10:00 → 10:00 Point Produit", status: "0 min", statusClass: "nok" },
            { label: "10:30 → 14:00 1:1 Manager", status: "ok", statusClass: "ok" },
          ],
          more: null,
        },
        {
          type: "debordement",
          name: "Débordement",
          summary: "0 mail hors plage",
          summaryClass: "good",
          rows: [{ label: "Aucune activité hors 8h-20h", status: "✓", statusClass: "ok" }],
          more: null,
        },
        {
          type: "deepwork",
          name: "Plage de travail profond",
          summary: "4 blocs · 8h18",
          summaryClass: "neutral",
          rows: [
            { label: "08:00–09:00 (60 min)", status: "✓", statusClass: "ok" },
            { label: "10:30–14:00 (150 min)", status: "✓", statusClass: "ok" },
          ],
          more: "+ 2 autres...",
        },
      ],
    },
    timeline: {
      events: [
        { start: 9, end: 10, name: "Comité Direction", variant: "blue" },
        { start: 10, end: 10.5, name: "Point Produit", variant: "purple" },
        { start: 14, end: 15, name: "1:1 Manager", variant: "teal" },
      ],
      overlays: {
        multitask: [{ start: 10, end: 10.5, label: "2 mails" }],
        transitions: [{ start: 10, end: 10, label: "0 min" }],
        debordement: [],
        deepwork: [
          { start: 8, end: 9, label: "1h" },
          { start: 10.5, end: 12.5, label: "2h" },
          { start: 13.5, end: 14, label: "30 min" },
          { start: 15, end: 20, label: "5h" },
        ],
      },
    },
  },

  // ============================================================
  // Mercredi 8 avril — pas encore de données
  // ============================================================
  {
    score: {
      dayLabel: "Mercredi 8 avril",
      weekday: "Mer",
      dayNum: "8",
      score: null,
      scoreLabel: null,
      factors: null,
    },
    timeline: null,
  },

  // ============================================================
  // Jeudi 9 avril — pas encore de données
  // ============================================================
  {
    score: {
      dayLabel: "Jeudi 9 avril",
      weekday: "Jeu",
      dayNum: "9",
      score: null,
      scoreLabel: null,
      factors: null,
    },
    timeline: null,
  },

  // ============================================================
  // Vendredi 10 avril — pas encore de données
  // ============================================================
  {
    score: {
      dayLabel: "Vendredi 10 avril",
      weekday: "Ven",
      dayNum: "10",
      score: null,
      scoreLabel: null,
      factors: null,
    },
    timeline: null,
  },
];
