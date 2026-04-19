import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAnnotations } from "./useAnnotations";
import type { Annotation } from "../types/data-contract";

function annot(id: string, overrides: Partial<Annotation> = {}): Annotation {
  return {
    id,
    number: 1,
    temporality: "past",
    markerColor: "red",
    targetDate: "2026-04-09",
    shownByDefault: false,
    bubbleLeftPct: 0,
    bubble: { title: "t", description: "d" },
    conseil: {
      title: "",
      explanation: "",
      study: "",
      studySource: "",
      effort: "",
      effortLabel: "",
      impact: "",
    },
    ...overrides,
  };
}

const data: Annotation[] = [annot("a1"), annot("a2"), annot("a3")];

describe("useAnnotations", () => {
  it("démarre en mode default avec aucune sélection", () => {
    const { result } = renderHook(() => useAnnotations(data));
    expect(result.current.mode).toBe("default");
    expect(result.current.selectedId).toBeNull();
    expect(result.current.selected).toBeNull();
  });

  it("toggle(id) sélectionne une annotation → mode focus", () => {
    const { result } = renderHook(() => useAnnotations(data));
    act(() => result.current.toggle("a2"));
    expect(result.current.mode).toBe("focus");
    expect(result.current.selectedId).toBe("a2");
    expect(result.current.selected?.id).toBe("a2");
  });

  it("toggle sur l'annotation déjà active → retour default", () => {
    const { result } = renderHook(() => useAnnotations(data));
    act(() => result.current.toggle("a2"));
    act(() => result.current.toggle("a2"));
    expect(result.current.mode).toBe("default");
    expect(result.current.selectedId).toBeNull();
  });

  it("toggle sur un autre id → remplace la sélection", () => {
    const { result } = renderHook(() => useAnnotations(data));
    act(() => result.current.toggle("a1"));
    act(() => result.current.toggle("a3"));
    expect(result.current.selectedId).toBe("a3");
  });

  it("reset() force le retour en default", () => {
    const { result } = renderHook(() => useAnnotations(data));
    act(() => result.current.toggle("a2"));
    act(() => result.current.reset());
    expect(result.current.mode).toBe("default");
    expect(result.current.selectedId).toBeNull();
  });

  it("Échap ramène en default quand focus est actif", () => {
    const { result } = renderHook(() => useAnnotations(data));
    act(() => result.current.toggle("a1"));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.mode).toBe("default");
  });

  it("selected est null si l'id n'existe pas dans la liste", () => {
    const { result } = renderHook(() => useAnnotations(data));
    act(() => result.current.toggle("inconnu"));
    expect(result.current.selected).toBeNull();
  });
});
