import { describe, it, expect } from "vitest";
import {
  averageScores,
  iraLabel,
  irra30DaysDelta,
  rolling30DaysScores,
  weeklyScores,
} from "./aggregate";
import type { DailyScores } from "./daily";

function score(ira: number, extra?: Partial<DailyScores>): DailyScores {
  return {
    transitions: 100,
    concentration: 100,
    horaires: 100,
    focus: 100,
    ira,
    ...extra,
  };
}

describe("averageScores", () => {
  it("null si liste vide", () => {
    expect(averageScores([])).toBeNull();
  });

  it("moyenne arrondie des IRA", () => {
    const days = [score(60), score(70), score(80)].map((s, i) => ({
      ...s,
      date: `2026-04-0${i + 1}`,
    }));
    expect(averageScores(days)?.ira).toBe(70);
  });
});

describe("weeklyScores", () => {
  it("null si aucun jour ouvré n'a de score", () => {
    expect(weeklyScores("2026-04-13", new Map())).toBeNull();
  });

  it("moyenne lun-ven uniquement (ignore samedi/dimanche)", () => {
    const m = new Map<string, DailyScores>();
    m.set("2026-04-13", score(60)); // lun
    m.set("2026-04-14", score(70)); // mar
    m.set("2026-04-15", score(80)); // mer
    m.set("2026-04-18", score(0));  // sam → doit être ignoré
    const agg = weeklyScores("2026-04-13", m);
    expect(agg?.ira).toBe(70);
  });
});

describe("rolling30DaysScores", () => {
  it("moyenne sur 30 derniers jours calendaires", () => {
    const today = new Date(2026, 3, 30);
    const m = new Map<string, DailyScores>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
      m.set(iso, score(50));
    }
    expect(rolling30DaysScores(today, m)?.ira).toBe(50);
  });

  it("null si aucune donnée", () => {
    expect(rolling30DaysScores(new Date(), new Map())).toBeNull();
  });
});

describe("irra30DaysDelta", () => {
  it("calcule la variation J vs J-7", () => {
    const today = new Date(2026, 3, 30);
    const m = new Map<string, DailyScores>();
    // 30 derniers jours (arrêtés aujourd'hui) → tous à 70
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
      m.set(iso, score(70));
    }
    // 30 derniers jours arrêtés à J-7 → les 7 plus récents manquent, supposons qu'on
    // ajoute 7 jours supplémentaires à 50 pour influencer la moyenne J-7
    for (let i = 30; i < 37; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
      m.set(iso, score(50));
    }
    const delta = irra30DaysDelta(today, m);
    expect(delta).not.toBeNull();
    expect(typeof delta).toBe("number");
  });

  it("null si pas assez de données", () => {
    expect(irra30DaysDelta(new Date(), new Map())).toBeNull();
  });
});

describe("iraLabel", () => {
  it("renvoie les 3 bandes", () => {
    expect(iraLabel(85)).toBe("Excellente capacité");
    expect(iraLabel(65)).toBe("Capacité modérée");
    expect(iraLabel(30)).toBe("Capacité faible");
    expect(iraLabel(70)).toBe("Excellente capacité"); // bord
    expect(iraLabel(50)).toBe("Capacité modérée"); // bord
    expect(iraLabel(49)).toBe("Capacité faible");
  });
});
