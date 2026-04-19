import * as React from "react";
import styles from "./StateView.module.css";

export const LoadingView: React.FC = () => (
  <div className={styles.state}>
    <div className={styles.inner}>
      <div className={styles.spinner} aria-hidden />
      <div className={styles.text}>Chargement de vos données Microsoft 365…</div>
    </div>
  </div>
);

export interface AuthViewProps {
  onSignIn: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSignIn }) => (
  <div className={styles.state}>
    <div className={styles.inner}>
      <div className={styles.title}>Connectez-vous pour afficher vos données</div>
      <div className={styles.text}>
        Gr33t a besoin d'accéder à votre calendrier Microsoft pour calculer
        votre rythme hebdomadaire.
      </div>
      <button type="button" className={styles.btn} onClick={onSignIn}>
        Se connecter à Microsoft 365
      </button>
    </div>
  </div>
);

export interface ErrorViewProps {
  message: string | null;
  onRetry: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message, onRetry }) => (
  <div className={styles.state}>
    <div className={styles.inner}>
      <div className={styles.title}>Impossible de charger vos données</div>
      {message && <div className={styles.errText}>{message}</div>}
      <button
        type="button"
        className={`${styles.btn} ${styles.btnSecondary}`}
        onClick={onRetry}
      >
        Réessayer
      </button>
    </div>
  </div>
);
