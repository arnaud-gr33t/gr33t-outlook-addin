import * as React from "react";
import {
  makeStyles,
  tokens,
  shorthands,
  Spinner,
  Button,
  Text,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    rowGap: "12px",
    ...shorthands.padding("32px", "24px"),
    textAlign: "center",
  },
  message: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: "18px",
    maxWidth: "280px",
  },
  errorMessage: {
    color: tokens.colorStatusDangerForeground1,
    fontSize: tokens.fontSizeBase200,
    fontFamily: tokens.fontFamilyMonospace,
    maxWidth: "280px",
    wordBreak: "break-word",
  },
});

export type StatusVariant =
  | "loading"
  | "authRequired"
  | "empty"
  | "error";

interface StatusViewProps {
  variant: StatusVariant;
  message?: string;
  errorDetail?: string | null;
  onAction?: () => void;
}

/**
 * Composant utilitaire affiché quand le TaskPane n'a pas de données à montrer :
 * chargement, connexion requise, pas de données du jour, erreur.
 */
const StatusView: React.FC<StatusViewProps> = ({
  variant,
  message,
  errorDetail,
  onAction,
}) => {
  const styles = useStyles();

  if (variant === "loading") {
    return (
      <div className={styles.root}>
        <Spinner size="medium" label={message ?? "Chargement…"} />
      </div>
    );
  }

  if (variant === "authRequired") {
    return (
      <div className={styles.root}>
        <Text className={styles.message}>
          {message ?? "Connecte-toi pour afficher tes données Gr33t."}
        </Text>
        <Button appearance="primary" onClick={onAction}>
          Se connecter à Outlook
        </Button>
      </div>
    );
  }

  if (variant === "empty") {
    return (
      <div className={styles.root}>
        <Text className={styles.message}>
          {message ??
            "Aucune donnée pour aujourd'hui. Relance le script demo-calendar.ts pour peupler les événements du jour."}
        </Text>
        {onAction && (
          <Button appearance="secondary" onClick={onAction}>
            Actualiser
          </Button>
        )}
      </div>
    );
  }

  // error
  return (
    <div className={styles.root}>
      <Text className={styles.message}>
        {message ?? "Une erreur est survenue."}
      </Text>
      {errorDetail && (
        <Text className={styles.errorMessage}>{errorDetail}</Text>
      )}
      {onAction && (
        <Button appearance="primary" onClick={onAction}>
          Réessayer
        </Button>
      )}
    </div>
  );
};

export default StatusView;
