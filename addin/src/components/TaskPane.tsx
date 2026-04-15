import * as React from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import type { FactorType } from "../types";
import type { RecoveryAdaptedData } from "../adapters/recoveryToDayScore";
import Header from "./Header";
import Timeline from "./Timeline";
import FactorList from "./FactorList";
import RefreshButton from "./RefreshButton";
import Footer from "./Footer";
import StatusView from "./StatusView";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    backgroundColor: tokens.colorNeutralBackground1,
    overflowY: "auto",
  },
});

type AuthStatus = "idle" | "loading" | "authRequired" | "ready" | "error";
type DataStatus = "idle" | "loading" | "ready" | "empty" | "error";

interface TaskPaneProps {
  authStatus: AuthStatus;
  authError: string | null;
  dataStatus: DataStatus;
  dataError: string | null;
  data: RecoveryAdaptedData | null;
  hoveredFactor: FactorType | null;
  onHoverFactor: (type: FactorType | null) => void;
  onClose: () => void;
  onRefresh: () => void;
  onSignIn: () => void;
  onRetryAuth: () => void;
}

/**
 * Layout principal du TaskPane Gr33t — vue "jour courant".
 *
 * Selon l'état auth/data, affiche :
 * - un StatusView (loading, authRequired, empty, error), ou
 * - le contenu normal : Header → Timeline → FactorList → RefreshButton → Footer
 */
const TaskPane: React.FC<TaskPaneProps> = ({
  authStatus,
  authError,
  dataStatus,
  dataError,
  data,
  hoveredFactor,
  onHoverFactor,
  onClose,
  onRefresh,
  onSignIn,
  onRetryAuth,
}) => {
  const styles = useStyles();

  // --- États auth prioritaires ---
  if (authStatus === "idle" || authStatus === "loading") {
    return (
      <div className={styles.root}>
        <StatusView variant="loading" message="Connexion à Outlook…" />
      </div>
    );
  }
  if (authStatus === "authRequired") {
    return (
      <div className={styles.root}>
        <StatusView variant="authRequired" onAction={onSignIn} />
      </div>
    );
  }
  if (authStatus === "error") {
    return (
      <div className={styles.root}>
        <StatusView
          variant="error"
          message="Connexion impossible."
          errorDetail={authError}
          onAction={onRetryAuth}
        />
      </div>
    );
  }

  // --- Auth OK → états data ---
  if (dataStatus === "idle" || dataStatus === "loading") {
    return (
      <div className={styles.root}>
        <StatusView variant="loading" message="Chargement des données du jour…" />
      </div>
    );
  }
  if (dataStatus === "empty") {
    return (
      <div className={styles.root}>
        <StatusView variant="empty" onAction={onRefresh} />
      </div>
    );
  }
  if (dataStatus === "error") {
    return (
      <div className={styles.root}>
        <StatusView
          variant="error"
          message="Impossible de récupérer les données du jour."
          errorDetail={dataError}
          onAction={onRefresh}
        />
      </div>
    );
  }

  // --- ready ---
  if (!data) {
    // sécurité : ne devrait pas arriver
    return (
      <div className={styles.root}>
        <StatusView variant="empty" onAction={onRefresh} />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Header day={data.score} onClose={onClose} />
      <Timeline timeline={data.timeline} hoveredFactor={hoveredFactor} />
      <FactorList factors={data.score.factors} onHoverFactor={onHoverFactor} />
      <RefreshButton onClick={onRefresh} />
      <Footer />
    </div>
  );
};

export default TaskPane;
