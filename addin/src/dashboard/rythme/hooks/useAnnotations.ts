import { useCallback, useEffect, useState } from "react";
import type { Annotation } from "../types/data-contract";

export type AnnotationMode = "default" | "focus";

export interface UseAnnotationsResult {
  mode: AnnotationMode;
  /** id de l'annotation actuellement sélectionnée (mode focus). */
  selectedId: string | null;
  /** Toggle : re-cliquer l'annotation active → retour default. */
  toggle: (id: string) => void;
  /** Force le retour en mode default. */
  reset: () => void;
  /** Retourne l'annotation sélectionnée (ou null si default). */
  selected: Annotation | null;
}

/**
 * State machine simple pour les annotations.
 * - default : seules les `shownByDefault=true` sont visibles dans la zone bulles.
 * - focus : seule l'annotation sélectionnée est visible.
 * Le retour en default se fait au re-clic du marqueur ou via Échap.
 */
export function useAnnotations(annotations: Annotation[]): UseAnnotationsResult {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const reset = useCallback(() => setSelectedId(null), []);

  // Touche Échap → retour default
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const selected = selectedId
    ? annotations.find((a) => a.id === selectedId) ?? null
    : null;

  return {
    mode: selectedId ? "focus" : "default",
    selectedId,
    toggle,
    reset,
    selected,
  };
}
