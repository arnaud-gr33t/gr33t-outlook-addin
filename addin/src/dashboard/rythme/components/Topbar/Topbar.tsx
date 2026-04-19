import * as React from "react";
import styles from "./Topbar.module.css";
import { formatDateLongFR } from "../../utils/date-utils";

export interface TopbarProps {
  /** Date de référence (affichée en petit sous la phrase). Défaut = aujourd'hui. */
  referenceDate?: Date | string;
}

const PHRASE =
  "Gr33t vous aide à mieux gérer votre récupération pour gagner en efficacité et en qualité de vie";

export const Topbar: React.FC<TopbarProps> = ({ referenceDate = new Date() }) => {
  // Le logo G et le titre "Gr33t" sont déjà affichés par le chrome Outlook
  // (via le `name` du staticTab du manifest Teams), on ne les duplique pas ici.
  return (
    <header className={styles.topbar}>
      <div className={styles.text}>
        <div className={styles.phrase}>{PHRASE}</div>
        <div className={styles.date}>{formatDateLongFR(referenceDate)}</div>
      </div>
      <button
        type="button"
        className={styles.more}
        aria-label="Plus d'options"
        title="Plus d'options"
      >
        <span className="material-symbols-rounded">more_horiz</span>
      </button>
    </header>
  );
};
