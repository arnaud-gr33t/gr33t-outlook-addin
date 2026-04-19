import * as React from "react";
import styles from "./LeviersStack.module.css";
import type { Levier, LevierId } from "../../types/data-contract";

export interface LeviersStackProps {
  leviers: Levier[];
}

/** Mapping icône Material Symbol pour chaque levier (selon la maquette). */
const LEVIER_ICON: Record<LevierId, string> = {
  transitions: "more_time",
  concentration: "center_focus_strong",
  horaires: "schedule",
  focus_reunion: "visibility",
};

/**
 * Convertit une var CSS `var(--tertiary)` → `rgba(..., 0.15)` approximative.
 * Utilisé pour le fond du badge icône (15% de la couleur du levier positif).
 */
function bgFromColorVar(colorVar: string): string {
  const m = colorVar.match(/var\(--(\w+)\)/);
  if (!m) return "rgba(0,0,0,0.08)";
  const map: Record<string, string> = {
    tertiary: "rgba(32, 174, 226, 0.15)",
    primary: "rgba(34, 102, 221, 0.15)",
    secondary: "rgba(32, 92, 187, 0.15)",
    positive: "rgba(77, 173, 51, 0.15)",
    intermediate: "rgba(237, 109, 45, 0.15)",
    negative: "rgba(239, 78, 120, 0.15)",
  };
  return map[m[1]] ?? "rgba(0,0,0,0.08)";
}

interface RowProps {
  levier: Levier;
}

const LevierRow: React.FC<RowProps> = ({ levier }) => {
  const icon = LEVIER_ICON[levier.id];
  return (
    <div className={styles.card}>
      <div className={styles.halves}>
        {/* Côté positif (gauche) */}
        <div className={styles.half}>
          <div className={styles.pct} style={{ color: levier.positive.colorVar }}>
            {levier.positive.percent}%
          </div>
          <div
            className={styles.icon}
            style={{
              background: bgFromColorVar(levier.positive.colorVar),
              color: levier.positive.colorVar,
            }}
            aria-hidden
          >
            <span className="material-symbols-rounded">{icon}</span>
          </div>
          <div className={styles.title}>
            {levier.positive.label}
            <span className={styles.infoDot} aria-hidden>
              ?
            </span>
          </div>
          <div className={styles.tip}>{levier.positive.description}</div>
        </div>
        {/* Côté négatif (droite) */}
        <div className={`${styles.half} ${styles.right}`}>
          <div className={styles.title}>
            {levier.negative.label}
            <span className={styles.infoDot} aria-hidden>
              ?
            </span>
          </div>
          <div className={styles.pct} style={{ color: levier.negative.colorVar }}>
            {levier.negative.percent}%
          </div>
          <div className={styles.tip}>{levier.negative.description}</div>
        </div>
      </div>
      <div className={styles.bar}>
        <div
          className={styles.barPos}
          style={{
            width: `${levier.positive.percent}%`,
            background: levier.positive.colorVar,
          }}
        />
        <div
          className={styles.barNeg}
          style={{
            width: `${levier.negative.percent}%`,
            background: levier.negative.colorVar,
          }}
        />
      </div>
    </div>
  );
};

/**
 * Dalle contenant les 4 leviers empilés avec bordure partagée.
 * Chaque levier : 2 halves (positif/négatif) + barre bipolaire 10 px.
 */
export const LeviersStack: React.FC<LeviersStackProps> = ({ leviers }) => {
  return (
    <div className={styles.stack}>
      {leviers.map((l) => (
        <LevierRow key={l.id} levier={l} />
      ))}
    </div>
  );
};
