import * as React from "react";
import styles from "./IraCard.module.css";
import type { IraScore } from "../../types/data-contract";

export interface IraCardProps {
  ira: IraScore;
}

function trendingIcon(delta: number): string {
  if (delta > 0) return "trending_up";
  if (delta < 0) return "trending_down";
  return "trending_flat";
}

/**
 * Carte IRA compacte (colonne 1 du bloc bas).
 * Fond dégradé orange, score 54 px, delta avec icône trending, tooltip (i).
 */
export const IraCard: React.FC<IraCardProps> = ({ ira }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.icon} aria-hidden>
          <span className="material-symbols-rounded">bolt</span>
        </div>
        <div>
          <div className={styles.headerLabel}>Votre score</div>
          <div className={styles.headerTitle}>
            IRA
            <span
              className={styles.info}
              tabIndex={0}
              role="button"
              aria-label="À propos de l'IRA"
            >
              <span className="material-symbols-rounded">info</span>
              <span className={styles.tip}>
                <strong>Indice de Récupération Actif</strong>
                Résume dans un indice le suivi des facteurs de récupération
                permettant de contenir la fatigue cognitive. L'indice est
                calculé sur les 30 derniers jours.
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className={styles.value}>
        {ira.value}
        <small>/100</small>
      </div>
      <div className={styles.state}>{ira.label}</div>
      <div className={styles.delta}>
        <span className="material-symbols-rounded">{trendingIcon(ira.delta)}</span>
        {ira.delta > 0 ? "+" : ""}
        {ira.delta} pt{Math.abs(ira.delta) > 1 ? "s" : ""} vs semaine dernière
      </div>
    </div>
  );
};
