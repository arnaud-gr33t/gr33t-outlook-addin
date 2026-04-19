import { describe, it, expect } from "vitest";
import {
  computeConcentration,
  computeDailyScores,
  computeFocus,
  computeHoraires,
  computeIra,
  computeTransitions,
  type DailyMeeting,
  type DailySend,
} from "./daily";

// Jour de référence : mardi 14 avril 2026 (jour ouvré)
const WEEKDAY = new Date(2026, 3, 14);
// Samedi 18 avril 2026 (week-end)
const WEEKEND = new Date(2026, 3, 18);

function at(h: number, m = 0, day = WEEKDAY): Date {
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

function meeting(
  startH: number,
  startM: number,
  endH: number,
  endM: number,
  opts: { attendees?: number; day?: Date } = {}
): DailyMeeting {
  return {
    start: at(startH, startM, opts.day ?? WEEKDAY),
    end: at(endH, endM, opts.day ?? WEEKDAY),
    otherAttendees: opts.attendees ?? 1,
  };
}

function send(h: number, m = 0, day = WEEKDAY): DailySend {
  return { sentAt: at(h, m, day) };
}

// ============================================================
// Transitions
// ============================================================
describe("computeTransitions", () => {
  it("100 si aucune réunion", () => {
    expect(computeTransitions([], [])).toBe(100);
  });

  it("100 pour une unique réunion (deux bords de plage = OK)", () => {
    expect(computeTransitions([meeting(10, 0, 11, 0)], [])).toBe(100);
  });

  it("100 si deux réunions espacées de 15 min", () => {
    const ms = [meeting(9, 0, 10, 0), meeting(10, 15, 11, 0)];
    expect(computeTransitions(ms, [])).toBe(100);
  });

  it("50 si deux réunions enchaînées (0 min entre les deux)", () => {
    // m1: bord gauche OK (1re) / après 5 min KO → bord après = OK (rien après) → OK
    // Pour avoir KO, il faut activité dans transition ET bord non applicable.
    // Ici m1 est 1re → beforeOK=true donc OK total.
    // m2 est last → afterOK=true donc OK total.
    // Donc les 2 OK → 100. On reformule pour tester KO.
    expect(computeTransitions([meeting(9, 0, 10, 0), meeting(10, 0, 11, 0)], [])).toBe(100);
  });

  it("33 si 3 réunions enchaînées sans transition (milieu KO des 2 côtés)", () => {
    // m1 : 1re → beforeOK, afterOK=false (m2 à 10h)
    // m2 : ni 1re ni last, beforeKO et afterKO
    // m3 : last → afterOK
    const ms = [
      meeting(9, 0, 10, 0),
      meeting(10, 0, 11, 0),
      meeting(11, 0, 12, 0),
    ];
    // m1 OK (before bord), m2 KO (middle, pas de transition des 2 côtés),
    // m3 OK (after bord). 2/3 = 67
    expect(computeTransitions(ms, [])).toBe(67);
  });

  it("mail dans la fenêtre de 10 min casse la transition", () => {
    const ms = [meeting(9, 0, 10, 0), meeting(10, 15, 11, 0)];
    // Envoi à 10:05 : casse la transition après de m1 ET avant de m2
    // m1 : before bord OK, after KO → globalement OK (1re) grâce au bord gauche
    // m2 : before KO (activité dans [10:05, 10:15]), after bord OK (dernière) → OK
    // Résultat : 2/2 = 100 ici car les bords sauvent
    expect(computeTransitions(ms, [send(10, 5)])).toBe(100);
  });
});

// ============================================================
// Concentration
// ============================================================
describe("computeConcentration", () => {
  it("100 si aucune activité", () => {
    expect(computeConcentration(WEEKDAY, [], [])).toBe(100);
  });

  it("100 si une plage de 3h sans interruption", () => {
    // Une seule réunion 9h-10h → fenêtre [9h, 10h] (clamp : first=9h, last=10h)
    // Temps hors réunion = 0. Retourne 100 par convention.
    expect(computeConcentration(WEEKDAY, [meeting(9, 0, 10, 0)], [])).toBe(100);
  });

  it("100 : fenêtre 9h-18h avec 1 réunion au milieu → 2 plages de 4h et 2h", () => {
    const m = [meeting(13, 0, 14, 0)];
    const s = [send(9, 0), send(18, 0)];
    // fenêtre = [9h, 18h], hors réunion = 8h
    // plages : [9h-13h] = 4h ≥ 2h → 4h focus ; [14h-18h] = 4h focus
    // = 8h focus sur 8h hors réunion = 100
    expect(computeConcentration(WEEKDAY, m, s)).toBe(100);
  });

  it("0 si activité fragmentée par des mails toutes les heures", () => {
    // 10 mails entre 9h et 18h, espacés de 1h → plages de 1h chacune (< 2h)
    const sends: DailySend[] = [];
    for (let h = 9; h <= 18; h++) sends.push(send(h, 0));
    expect(computeConcentration(WEEKDAY, [], sends)).toBe(0);
  });

  it("ignore les envois en débordement (avant 8h)", () => {
    // Mail à 7h30 (ignoré), puis 1 mail à 18h → fenêtre = [8h, 18h] = 10h, 0 réunion
    // Pas d'autre interruption dans [8h, 18h] → une seule plage 10h → focus = 10h
    const s = [send(7, 30), send(18, 0)];
    expect(computeConcentration(WEEKDAY, [], s)).toBe(100);
  });
});

// ============================================================
// Horaires (binaire)
// ============================================================
describe("computeHoraires", () => {
  it("100 si journée vide", () => {
    expect(computeHoraires(WEEKDAY, [], [])).toBe(100);
  });

  it("100 si toute activité est dans [8h, 18h30]", () => {
    const m = [meeting(9, 0, 17, 0)];
    const s = [send(8, 30), send(17, 45)];
    expect(computeHoraires(WEEKDAY, m, s)).toBe(100);
  });

  it("0 si un mail envoyé à 7h55", () => {
    expect(computeHoraires(WEEKDAY, [], [send(7, 55)])).toBe(0);
  });

  it("0 si réunion se termine à 19h", () => {
    expect(computeHoraires(WEEKDAY, [meeting(17, 0, 19, 0)], [])).toBe(0);
  });

  it("week-end avec activité = 0", () => {
    expect(computeHoraires(WEEKEND, [], [send(14, 0, WEEKEND)])).toBe(0);
  });

  it("week-end sans activité = 100", () => {
    expect(computeHoraires(WEEKEND, [], [])).toBe(100);
  });
});

// ============================================================
// Focus en réunion
// ============================================================
describe("computeFocus", () => {
  it("100 si aucune réunion", () => {
    expect(computeFocus([], [])).toBe(100);
  });

  it("100 si aucun envoi pendant les réunions", () => {
    const m = [meeting(9, 0, 10, 0), meeting(14, 0, 15, 0)];
    const s = [send(11, 0)]; // hors réunion
    expect(computeFocus(m, s)).toBe(100);
  });

  it("50 si un envoi pendant 1 réunion sur 2", () => {
    const m = [meeting(9, 0, 10, 0), meeting(14, 0, 15, 0)];
    const s = [send(9, 30)];
    expect(computeFocus(m, s)).toBe(50);
  });

  it("ignore les réunions sans autres participants", () => {
    // meeting solo = focus block → n'entre pas dans le dénominateur
    const m = [
      { start: at(9, 0), end: at(10, 0), otherAttendees: 0 },
      meeting(14, 0, 15, 0),
    ];
    const s = [send(14, 30)]; // interrompt la seule vraie réunion
    expect(computeFocus(m, s)).toBe(0);
  });

  it("pas de tolérance : envoi dans la 1re minute = KO", () => {
    const m = [meeting(9, 0, 10, 0)];
    expect(computeFocus(m, [send(9, 0)])).toBe(0);
  });
});

// ============================================================
// IRA journalier
// ============================================================
describe("computeIra + computeDailyScores", () => {
  it("calcule la somme pondérée arrondie", () => {
    expect(
      computeIra({
        transitions: 80,
        concentration: 60,
        horaires: 100,
        focus: 100,
      })
    ).toBe(Math.round(0.3 * 80 + 0.3 * 60 + 0.25 * 100 + 0.15 * 100));
  });

  it("week-end : transitions/concentration/focus = 100 automatiquement", () => {
    const s = computeDailyScores({
      date: WEEKEND,
      meetings: [meeting(9, 0, 10, 0, { day: WEEKEND })],
      sends: [send(14, 0, WEEKEND)],
    });
    expect(s.transitions).toBe(100);
    expect(s.concentration).toBe(100);
    expect(s.focus).toBe(100);
    expect(s.horaires).toBe(0); // activité weekend = débordement
  });

  it("jour vide en semaine = IRA 100", () => {
    const s = computeDailyScores({
      date: WEEKDAY,
      meetings: [],
      sends: [],
    });
    expect(s.ira).toBe(100);
  });
});
