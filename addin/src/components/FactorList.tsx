import * as React from "react";
import { makeStyles, tokens, shorthands } from "@fluentui/react-components";
import type { Factor, FactorType } from "../types";
import FactorCard from "./FactorCard";

const useStyles = makeStyles({
  container: {
    ...shorthands.padding("8px", 0),
  },
  emptyState: {
    ...shorthands.padding("32px", "24px"),
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  emptyIcon: {
    fontSize: "28px",
    marginBottom: "8px",
    opacity: 0.5,
  },
});

interface FactorListProps {
  factors: Factor[] | null;
  onHoverFactor: (type: FactorType | null) => void;
}

/**
 * Liste des 4 facteurs. Affiche un état vide si les données ne sont pas encore disponibles.
 */
const FactorList: React.FC<FactorListProps> = ({ factors, onHoverFactor }) => {
  const styles = useStyles();

  if (!factors) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📊</div>
        Les indicateurs seront calculés
        <br />à la fin de la journée.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {factors.map((factor, idx) => (
        <FactorCard
          key={factor.type}
          factor={factor}
          isLast={idx === factors.length - 1}
          onHover={onHoverFactor}
        />
      ))}
    </div>
  );
};

export default FactorList;
