import { describe, it, expect } from "vitest";
import {
  formatDateLongFR,
  formatDayMonthFR,
  formatWeekRangeFR,
  getIsoWeek,
  parseIsoDate,
} from "./date-utils";

describe("parseIsoDate", () => {
  it("parse une string ISO en Date locale minuit", () => {
    const d = parseIsoDate("2026-04-14");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3); // avril = 3
    expect(d.getDate()).toBe(14);
    expect(d.getHours()).toBe(0);
  });
});

describe("formatDateLongFR", () => {
  it("formate un lundi 7 avril 2026", () => {
    expect(formatDateLongFR("2026-04-07")).toBe("Mardi 7 avril 2026");
  });
  it("accepte une instance Date", () => {
    const d = new Date(2026, 3, 14);
    expect(formatDateLongFR(d)).toBe("Mardi 14 avril 2026");
  });
  it("capitalise le jour de la semaine", () => {
    const s = formatDateLongFR("2026-01-01");
    expect(s[0]).toMatch(/[A-Z]/);
  });
});

describe("formatDayMonthFR", () => {
  it("format 'jour mois' minuscule", () => {
    expect(formatDayMonthFR("2026-04-07")).toBe("7 avril");
    expect(formatDayMonthFR("2026-12-25")).toBe("25 décembre");
  });
});

describe("formatWeekRangeFR", () => {
  it("concat mois commun : '7 → 11 avril'", () => {
    expect(formatWeekRangeFR("2026-04-07")).toBe("7 → 11 avril");
  });
  it("mois différents : précise les 2 mois", () => {
    // Lundi 27 avril 2026, vendredi = 1er mai 2026
    expect(formatWeekRangeFR("2026-04-27")).toBe("27 avril → 1 mai");
  });
});

describe("getIsoWeek", () => {
  it("semaine 1 en début janvier", () => {
    expect(getIsoWeek(new Date(2026, 0, 5))).toBe(2);
  });
  it("semaine 15 en avril 2026", () => {
    // 2026-04-07 est un mardi → ISO week 15
    expect(getIsoWeek(new Date(2026, 3, 7))).toBe(15);
  });
});
