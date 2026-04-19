import { describe, it, expect } from "vitest";
import {
  FOCUS_MIN_MIN,
  durationMinutes,
  meetingSeverity,
  meetingSeverityLabel,
  multitaskLabel,
  rangeToPercent,
  timeToMinutes,
  timeToPercent,
} from "./layout-utils";
import type { Meeting } from "../types/data-contract";

function mtg(partial: Partial<Meeting> = {}): Meeting {
  return {
    start: "09:00",
    end: "10:00",
    title: "Test",
    trans: "ok",
    multi: 0,
    ...partial,
  };
}

describe("timeToMinutes", () => {
  it("convertit HH:MM en minutes", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:00")).toBe(540);
    expect(timeToMinutes("19:47")).toBe(19 * 60 + 47);
  });
});

describe("timeToPercent (plage 7h-21h = 14h)", () => {
  it("renvoie 0 pour 7h00 (début de plage)", () => {
    expect(timeToPercent("07:00")).toBe(0);
  });
  it("renvoie 100 pour 21h00 (fin de plage)", () => {
    expect(timeToPercent("21:00")).toBe(100);
  });
  it("renvoie ~50 pour 14h00 (milieu)", () => {
    expect(timeToPercent("14:00")).toBeCloseTo(50, 0);
  });
  it("clampe à 0 pour les heures avant 7h", () => {
    expect(timeToPercent("06:00")).toBe(0);
    expect(timeToPercent("00:00")).toBe(0);
  });
  it("clampe à 100 pour les heures après 21h", () => {
    expect(timeToPercent("22:00")).toBe(100);
    expect(timeToPercent("23:59")).toBe(100);
  });
});

describe("rangeToPercent", () => {
  it("renvoie left et width cohérents", () => {
    const { left, width } = rangeToPercent("09:00", "10:00");
    expect(left).toBeCloseTo(14.28, 1);
    expect(width).toBeCloseTo(7.14, 1);
  });
  it("impose un width minimum de 0.3", () => {
    const { width } = rangeToPercent("09:00", "09:00");
    expect(width).toBe(0.3);
  });
});

describe("durationMinutes", () => {
  it("calcule la durée en minutes", () => {
    expect(durationMinutes("09:00", "10:00")).toBe(60);
    expect(durationMinutes("14:30", "16:00")).toBe(90);
    expect(durationMinutes("09:00", "09:00")).toBe(0);
  });
});

describe("FOCUS_MIN_MIN", () => {
  it("est défini à 20 min (filtre vue compacte)", () => {
    expect(FOCUS_MIN_MIN).toBe(20);
  });
});

describe("meetingSeverity", () => {
  it("meeting-blue si trans=ok et multi=0", () => {
    expect(meetingSeverity(mtg())).toBe("meeting-blue");
  });
  it("meeting-orange si trans=ko sans multi", () => {
    expect(meetingSeverity(mtg({ trans: "ko" }))).toBe("meeting-orange");
  });
  it("meeting-orange si multi=1 avec trans=ok", () => {
    expect(meetingSeverity(mtg({ multi: 1 }))).toBe("meeting-orange");
  });
  it("meeting-red si trans=ko ET multi>0", () => {
    expect(meetingSeverity(mtg({ trans: "ko", multi: 2 }))).toBe("meeting-red");
  });
  it("meeting-red si multi≥3 même avec trans=ok", () => {
    expect(meetingSeverity(mtg({ multi: 3 }))).toBe("meeting-red");
  });
  it("meeting-future si future=true et sans issue", () => {
    expect(meetingSeverity(mtg({ future: true }))).toBe("meeting-future");
  });
  it("meeting-future-pending si future + trans=ko ou multi>0", () => {
    expect(meetingSeverity(mtg({ future: true, trans: "ko" }))).toBe(
      "meeting-future-pending"
    );
    expect(meetingSeverity(mtg({ future: true, multi: 1 }))).toBe(
      "meeting-future-pending"
    );
  });
});

describe("meetingSeverityLabel", () => {
  it("'À venir' pour future", () => {
    expect(meetingSeverityLabel(mtg({ future: true }))).toBe("À venir");
  });
  it("'Bonnes conditions' par défaut", () => {
    expect(meetingSeverityLabel(mtg())).toBe("Bonnes conditions de réunion");
  });
  it("'Conditions moyennes' en cas de trans=ko OU multi>0", () => {
    expect(meetingSeverityLabel(mtg({ trans: "ko" }))).toBe("Conditions moyennes");
  });
  it("'Conditions dégradées' en cas cumulé", () => {
    expect(meetingSeverityLabel(mtg({ trans: "ko", multi: 2 }))).toBe(
      "Conditions dégradées"
    );
  });
});

describe("multitaskLabel", () => {
  it("singulier/pluriel selon count", () => {
    expect(multitaskLabel(0)).toBe("Pas de multitâche");
    expect(multitaskLabel(1)).toBe("1 interaction pendant");
    expect(multitaskLabel(4)).toBe("4 interactions pendant");
  });
});
