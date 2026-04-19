import * as React from "react";
import styles from "./ConseilPanel.module.css";
import type { Annotation } from "../../types/data-contract";

export interface ConseilPanelProps {
  /** Annotation actuellement sélectionnée. Null → état vide. */
  annotation: Annotation | null;
}

/**
 * Panneau conseil (colonne 3 du bloc bas).
 * - État vide : icône touch_app + invitation
 * - État actif : titre du conseil + explication + bloc étude + grille effort/impact + 2 boutons
 */
export const ConseilPanel: React.FC<ConseilPanelProps> = ({ annotation }) => {
  if (!annotation) {
    return (
      <div className={`${styles.panel} ${styles.empty}`}>
        <div className={styles.emptyIcon} aria-hidden>
          <span className="material-symbols-rounded">touch_app</span>
        </div>
        <div className={styles.emptyText}>
          Cliquez sur une annotation de la timeline pour en savoir plus.
          Chaque conseil progresse à son rythme.
        </div>
      </div>
    );
  }

  const c = annotation.conseil;
  return (
    <div className={`${styles.panel} ${styles.active}`}>
      <div className={styles.title}>{c.title}</div>
      <div
        className={styles.explanation}
        // L'explication peut contenir du <strong> provenant du mock interne
        // (pas d'input utilisateur), donc dangerouslySetInnerHTML est sûr ici.
        dangerouslySetInnerHTML={{ __html: c.explanation }}
      />
      <div className={styles.studyBlock}>
        <div className={styles.studyKicker}>Ce que disent les études</div>
        <div className={styles.studyText}>{c.study}</div>
        <div className={styles.studySource}>{c.studySource}</div>
      </div>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Effort</div>
          <div className={styles.metricValue}>
            {c.effort}
            <small>{c.effortLabel}</small>
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Impact IRA</div>
          <div className={styles.metricImpact}>{c.impact}</div>
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`}>
          Études
        </button>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
          Voir l'action →
        </button>
      </div>
    </div>
  );
};
