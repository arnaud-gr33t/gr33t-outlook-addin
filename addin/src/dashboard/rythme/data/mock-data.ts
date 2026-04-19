import type {
  Annotation,
  DashboardData,
  DayData,
  Levier,
  Meeting,
  FocusBand,
  Overflow,
} from "../types/data-contract";

// ============================================================
// MOCK — 3 semaines du 7 avril 2026 au 25 avril 2026
// Référence fidèle à scenario-C-rythme_31.html (daysData).
// ============================================================

type DayMock = {
  date: string;
  shortLabel: string;
  dayNumber: number;
  meetings: Meeting[];
  focusBands: FocusBand[];
  overflows: Overflow[];
};

function day(
  date: string,
  shortLabel: string,
  dayNumber: number,
  meetings: Meeting[],
  focusBands: FocusBand[] = [],
  overflows: Overflow[] = []
): DayMock {
  return { date, shortLabel, dayNumber, meetings, focusBands, overflows };
}

// --- SEMAINE S-1 (7-11 avril, passée) ---
const lun7 = day(
  "2026-04-07",
  "Lun",
  7,
  [
    { start: "11:00", end: "12:00", title: "Réunion équipe", trans: "ok", multi: 0 },
    { start: "14:00", end: "15:00", title: "Client", trans: "ok", multi: 0 },
  ],
  [
    { start: "09:00", end: "11:00", kind: "observed" },
    { start: "15:00", end: "17:00", kind: "observed" },
  ]
);

const mar8 = day(
  "2026-04-08",
  "Mar",
  8,
  [
    { start: "10:30", end: "11:30", title: "Weekly Gr33t", trans: "ok", multi: 0 },
    { start: "11:30", end: "12:00", title: "Point Lecko", trans: "ko", multi: 0 },
    { start: "14:30", end: "16:00", title: "Revue roadmap", trans: "ok", multi: 1 },
  ],
  [
    { start: "09:00", end: "10:30", kind: "observed" },
    { start: "13:30", end: "14:30", kind: "observed" },
  ]
);

const mer9 = day(
  "2026-04-09",
  "Mer",
  9,
  [
    { start: "09:00", end: "09:30", title: "point tel cpms", trans: "ok", multi: 0 },
    { start: "10:45", end: "11:30", title: "Co-Biz", trans: "ko", multi: 0 },
    { start: "11:30", end: "12:00", title: "Facilitation Greet", trans: "ko", multi: 0 },
    { start: "12:15", end: "13:15", title: "Dej COMOP", trans: "ok", multi: 0 },
    { start: "14:30", end: "15:15", title: "Point synchro + débrief", trans: "ok", multi: 0 },
    { start: "18:00", end: "19:30", title: "Afterwork Lecko x LumApps", trans: "ok", multi: 0 },
  ],
  [
    { start: "09:30", end: "10:45", kind: "observed" },
    { start: "13:30", end: "14:30", kind: "observed" },
    { start: "15:15", end: "18:00", kind: "observed" },
  ]
);

const jeu10 = day(
  "2026-04-10",
  "Jeu",
  10,
  [
    { start: "09:00", end: "10:00", title: "Sync équipe", trans: "ok", multi: 0 },
    { start: "14:00", end: "15:00", title: "Client Accor", trans: "ok", multi: 1 },
  ],
  [
    { start: "10:00", end: "12:00", kind: "observed" },
    { start: "15:30", end: "17:30", kind: "observed" },
  ]
);

const ven11 = day(
  "2026-04-11",
  "Ven",
  11,
  [
    { start: "10:00", end: "11:00", title: "Rétro sprint", trans: "ok", multi: 0 },
    { start: "14:00", end: "15:00", title: "Sync backlog", trans: "ok", multi: 0 },
  ],
  [
    { start: "09:00", end: "10:00", kind: "observed" },
    { start: "11:00", end: "12:00", kind: "observed" },
  ],
  [{ time: "19:47", type: "mail_sent" }]
);

// --- SEMAINE S (14-18 avril, en cours) ---
const lun14 = day(
  "2026-04-14",
  "Lun",
  14,
  [
    { start: "09:30", end: "10:00", title: "Stand-up", trans: "ok", multi: 0, future: true },
    { start: "11:00", end: "11:45", title: "Client Accor", trans: "ok", multi: 0, future: true },
  ]
);

const mar15 = day(
  "2026-04-15",
  "Mar",
  15,
  [
    { start: "09:00", end: "10:00", title: "Gr33t weekly", trans: "ok", multi: 0, future: true },
    { start: "10:00", end: "11:00", title: "L'Oréal", trans: "ko", multi: 0, future: true },
    { start: "11:00", end: "12:00", title: "RDV commercial", trans: "ko", multi: 0, future: true },
    { start: "12:00", end: "13:00", title: "Comité produit", trans: "ko", multi: 0, future: true },
  ]
);

const mer16 = day(
  "2026-04-16",
  "Mer",
  16,
  [
    { start: "10:00", end: "11:00", title: "Revue produit", trans: "ok", multi: 0, future: true },
  ]
);

const jeu17 = day(
  "2026-04-17",
  "Jeu",
  17,
  [
    { start: "14:00", end: "15:00", title: "Direction", trans: "ok", multi: 0, future: true },
  ]
);

const ven18 = day(
  "2026-04-18",
  "Ven",
  18,
  [
    { start: "10:00", end: "11:00", title: "Rétro", trans: "ok", multi: 0, future: true },
  ]
);

// --- SEMAINE S+1 (21-25 avril) ---
const lun21 = day(
  "2026-04-21",
  "Lun",
  21,
  [
    { start: "09:30", end: "10:00", title: "Stand-up", trans: "ok", multi: 0, future: true },
    { start: "11:00", end: "11:45", title: "Client SwissLife", trans: "ok", multi: 0, future: true },
  ]
);

const mar22 = day(
  "2026-04-22",
  "Mar",
  22,
  [
    { start: "14:00", end: "15:00", title: "Sync équipe", trans: "ok", multi: 0, future: true },
  ]
);

const mer23 = day(
  "2026-04-23",
  "Mer",
  23,
  [
    { start: "09:00", end: "10:00", title: "Sprint", trans: "ok", multi: 0, future: true },
    { start: "10:00", end: "11:00", title: "L'Oréal", trans: "ko", multi: 0, future: true },
    { start: "11:00", end: "12:00", title: "Comité", trans: "ko", multi: 0, future: true },
  ]
);

const jeu24 = day("2026-04-24", "Jeu", 24, []);

const ven25 = day(
  "2026-04-25",
  "Ven",
  25,
  [
    { start: "10:00", end: "11:00", title: "Rétro", trans: "ok", multi: 0, future: true },
  ]
);

const REFERENCE_DATE = "2026-04-14"; // Aujourd'hui = Lundi 14 avril 2026

function toDay(m: DayMock): DayData {
  return {
    date: m.date,
    shortLabel: m.shortLabel,
    dayNumber: m.dayNumber,
    isToday: m.date === REFERENCE_DATE,
    meetings: m.meetings,
    focusBands: m.focusBands,
    overflows: m.overflows,
  };
}

// ============================================================
// LEVIERS — extraits fidèlement de la maquette
// ============================================================
const leviers: [Levier, Levier, Levier, Levier] = [
  {
    id: "transitions",
    positive: {
      label: "Transitions préservées",
      description:
        "Réunions précédées ou suivies d'une plage libre d'au moins 10 min.",
      percent: 65,
      colorVar: "var(--tertiary)",
    },
    negative: {
      label: "Réunions enchaînées",
      description:
        "Réunions enchaînées sans temps de récupération (< 10 min).",
      percent: 35,
      colorVar: "var(--intermediate)",
    },
  },
  {
    id: "concentration",
    positive: {
      label: "Plages de concentration",
      description:
        "Travail en plages continues de plus de 2h sans interruption.",
      percent: 58,
      colorVar: "var(--primary)",
    },
    negative: {
      label: "Multitâche permanent",
      description: "Travail fragmenté en plages de moins de 30 minutes.",
      percent: 42,
      colorVar: "var(--negative)",
    },
  },
  {
    id: "horaires",
    positive: {
      label: "Respect des horaires",
      description: "Journées sans activité avant 8h ou après 18h30.",
      percent: 70,
      colorVar: "var(--secondary)",
    },
    negative: {
      label: "Débordements horaires",
      description: "Journées avec mails, chats ou réunions hors 8h-18h30.",
      percent: 30,
      colorVar: "var(--negative)",
    },
  },
  {
    id: "focus_reunion",
    positive: {
      label: "Focus en réunion",
      description: "Réunions sans envoi de mails ou chats pendant leur durée.",
      percent: 72,
      colorVar: "var(--positive)",
    },
    negative: {
      label: "Multitâche en réunion",
      description: "Réunions durant lesquelles vous envoyez des mails ou chats.",
      percent: 28,
      colorVar: "var(--intermediate)",
    },
  },
];

// ============================================================
// ANNOTATIONS — 5 insights extraits de conseilContents (maquette)
// ============================================================
const annotations: Annotation[] = [
  {
    id: "a1",
    number: 1,
    temporality: "past",
    markerColor: "red",
    targetDate: "2026-04-09", // Mer 9
    shownByDefault: true,
    bubbleLeftPct: 14, // ~centre de la colonne mer9 dans la 1re semaine
    bubble: {
      title: "Mer 9 · chaîne 4×1h",
      description: "4 réunions enchaînées sans temps de transition.",
    },
    conseil: {
      title: "Créer des temps de transition",
      explanation:
        "Sans micro-pauses entre deux réunions, le cortex préfrontal reste en tension continue. Après 4h consécutives, ses <strong>capacités décisionnelles chutent de 40%</strong> — ce qui explique la fatigue perçue de fin de journée.",
      study:
        "70% des cadres ressentent une fatigue accrue après 3h continues de réunions.",
      studySource: "Microsoft Human Factors Lab, 2021",
      effort: "1/5",
      effortLabel: "très faible",
      impact: "+12 pts",
    },
  },
  {
    id: "a3",
    number: 2,
    temporality: "future",
    markerColor: "red",
    targetDate: "2026-04-15", // Mar 15
    shownByDefault: true,
    bubbleLeftPct: 42,
    bubble: {
      title: "Mar 15 · 4 réunions 9h-13h",
      description: "Matinée entière sans temps de récupération.",
    },
    conseil: {
      title: "Créer des temps de transition",
      explanation:
        "En raccourcissant chaque réunion de 10 min, vous créez <strong>40 min cumulées de récupération</strong> sur la matinée. Vos capacités de décision restent stables jusqu'au déjeuner au lieu de décroître progressivement.",
      study:
        "Les micro-pauses de 10 min entre réunions réduisent de 57% l'accumulation de stress mesurée à l'EEG.",
      studySource: "Microsoft Human Factors Lab, 2021",
      effort: "1/5",
      effortLabel: "très faible",
      impact: "+12 pts",
    },
  },
  {
    id: "a2",
    number: 3,
    temporality: "past",
    markerColor: "orange",
    targetDate: "2026-04-11", // Ven 11
    shownByDefault: false,
    bubbleLeftPct: 28,
    bubble: {
      title: "Ven 11 · envoi 19h47",
      description: "Mail envoyé hors plage de travail.",
    },
    conseil: {
      title: "Planifier vos envois de mails",
      explanation:
        "Un envoi tardif fait <strong>attendre une réponse à vos équipes hors de leurs heures</strong> ou crée une pression implicite à répondre. Ce signal répété installe une norme de disponibilité étendue, avec un effet mesurable sur la fatigue collective.",
      study:
        "63% des collaborateurs se sentent obligés de répondre aux mails reçus en soirée, même sans demande explicite.",
      studySource: "Malakoff Humanis / QVT 2023",
      effort: "1/5",
      effortLabel: "très faible",
      impact: "+8 pts",
    },
  },
  {
    id: "a4",
    number: 4,
    temporality: "future",
    markerColor: "positive",
    targetDate: "2026-04-16", // Mer 16
    shownByDefault: false,
    bubbleLeftPct: 50,
    bubble: {
      title: "Mer 16 · créneau libre 14-17h",
      description: "3h continues sans réunion — plage de focus à protéger.",
    },
    conseil: {
      title: "Plages de concentration",
      explanation:
        "3h continues sans réunion = terrain rare. En bloquant cette fenêtre en focus, vous pouvez avancer <strong>l'équivalent d'une demi-journée de travail fragmenté</strong> sur un sujet dense.",
      study:
        "Après une interruption, il faut en moyenne 23 minutes pour retrouver le même niveau de concentration.",
      studySource: "University of California, Irvine",
      effort: "1/5",
      effortLabel: "très faible",
      impact: "+5 pts",
    },
  },
  {
    id: "a5",
    number: 5,
    temporality: "future",
    markerColor: "orange",
    targetDate: "2026-04-23", // Mer 23
    shownByDefault: false,
    bubbleLeftPct: 74,
    bubble: {
      title: "Mer 23 · triple réunion",
      description: "3 réunions enchaînées — occasion de rationaliser.",
    },
    conseil: {
      title: "Questionner l'utilité de chaque réunion",
      explanation:
        "Transformer une réunion récurrente en résumé asynchrone libère <strong>1h de votre semaine et de celles de chaque participant</strong>. Sur 5 participants × 50 semaines, c'est près de 250h économisées à l'échelle de l'équipe.",
      study:
        "58% des cadres estiment qu'1 réunion sur 2 pourrait être évitée ou transformée en asynchrone.",
      studySource: "Harvard Business Review, 2022",
      effort: "2/5",
      effortLabel: "modéré",
      impact: "+8 pts",
    },
  },
];

// ============================================================
// EXPORT MAIN
// ============================================================
export const mockData: DashboardData = {
  referenceDate: REFERENCE_DATE,
  weeks: [
    {
      weekNumber: 15,
      mondayDate: "2026-04-07",
      kind: "past",
      score: { value: 68, kind: "value", label: "IRA S-1" },
      days: [toDay(lun7), toDay(mar8), toDay(mer9), toDay(jeu10), toDay(ven11)],
    },
    {
      weekNumber: 16,
      mondayDate: "2026-04-14",
      kind: "current",
      score: { value: -1, kind: "delta", label: "vs S-1" },
      days: [toDay(lun14), toDay(mar15), toDay(mer16), toDay(jeu17), toDay(ven18)],
    },
    {
      weekNumber: 17,
      mondayDate: "2026-04-21",
      kind: "future",
      score: { value: 0, kind: "count", label: "Réunions" },
      days: [toDay(lun21), toDay(mar22), toDay(mer23), toDay(jeu24), toDay(ven25)],
    },
  ],
  ira: {
    value: 65,
    label: "Capacité modérée",
    delta: -1,
  },
  leviers,
  annotations,
};
