import * as React from "react";
import { useState } from "react";
import styles from "./Annotations.module.css";
import type { Annotation } from "../../types/data-contract";

// ============================================================
// AnnotationMarker — pastille numérotée sur day-canvas
// ============================================================
export interface AnnotationMarkerProps {
  annotation: Annotation;
  isActive: boolean;
  /** hover croisé depuis la bulle → pulsation */
  isCrossHighlighted: boolean;
  onClick: (id: string) => void;
  onHoverChange: (id: string | null) => void;
}

const COLOR_CLASS: Record<Annotation["markerColor"], string> = {
  red: styles.red,
  orange: styles.orange,
  positive: styles.positive,
};

export const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({
  annotation,
  isActive,
  isCrossHighlighted,
  onClick,
  onHoverChange,
}) => {
  const colorClass = COLOR_CLASS[annotation.markerColor];
  return (
    <button
      type="button"
      className={`${styles.marker} ${colorClass} ${
        isActive ? styles.active : ""
      } ${annotation.shownByDefault ? styles.defaultShown : ""} ${
        isCrossHighlighted ? styles.crossHighlight : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(annotation.id);
      }}
      onMouseEnter={() => onHoverChange(annotation.id)}
      onMouseLeave={() => onHoverChange(null)}
      aria-label={`Annotation ${annotation.number} : ${annotation.bubble.title}`}
    >
      {annotation.number}
    </button>
  );
};

// ============================================================
// AnnotationBubble — bulle de résumé (mode default ou focus)
// ============================================================
export interface AnnotationBubbleProps {
  annotation: Annotation;
  isActive: boolean;
  isCrossHighlighted: boolean;
  onClick: (id: string) => void;
  onClose: () => void;
  onHoverChange: (id: string | null) => void;
}

export const AnnotationBubble: React.FC<AnnotationBubbleProps> = ({
  annotation,
  isActive,
  isCrossHighlighted,
  onClick,
  onClose,
  onHoverChange,
}) => {
  return (
    <div
      className={`${styles.bubble} ${isActive ? styles.activeBubble : ""} ${
        isCrossHighlighted ? styles.crossHighlight : ""
      }`}
      data-default={annotation.shownByDefault ? "true" : "false"}
      data-annot-num={annotation.number}
      style={{ left: `${annotation.bubbleLeftPct}%` }}
      onMouseEnter={() => onHoverChange(annotation.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <div
        className={styles.bubbleInner}
        onClick={() => onClick(annotation.id)}
      >
        <div className={styles.bubbleTitle}>
          <span
            className={`${styles.bubbleNum} ${
              COLOR_CLASS[annotation.markerColor]
            }`}
          >
            {annotation.number}
          </span>
          {annotation.bubble.title}
        </div>
        <div className={styles.bubbleDesc}>{annotation.bubble.description}</div>
        <button
          type="button"
          className={styles.close}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// ============================================================
// BubblesArea — conteneur des bulles, gère le mode default/focus
// ============================================================
export interface BubblesAreaProps {
  annotations: Annotation[];
  mode: "default" | "focus";
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** ID actuellement hover (pour cross-highlight entre marqueur et bulle). */
  hoveredId: string | null;
  onHoverChange: (id: string | null) => void;
}

export const BubblesArea: React.FC<BubblesAreaProps> = ({
  annotations,
  mode,
  selectedId,
  onSelect,
  onClose,
  hoveredId,
  onHoverChange,
}) => {
  return (
    <div className={styles.bubblesArea} data-mode={mode}>
      {annotations.map((a) => (
        <AnnotationBubble
          key={a.id}
          annotation={a}
          isActive={selectedId === a.id}
          isCrossHighlighted={hoveredId === a.id}
          onClick={onSelect}
          onClose={onClose}
          onHoverChange={onHoverChange}
        />
      ))}
    </div>
  );
};

// ============================================================
// Hook local : pilote le cross-hover entre marqueur et bulle.
// ============================================================
export function useCrossHover(): {
  hoveredId: string | null;
  onHoverChange: (id: string | null) => void;
} {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return { hoveredId, onHoverChange: setHoveredId };
}
