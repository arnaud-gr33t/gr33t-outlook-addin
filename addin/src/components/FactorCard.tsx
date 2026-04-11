import * as React from "react";
import { makeStyles, tokens, mergeClasses, shorthands } from "@fluentui/react-components";
import type { Factor, FactorType } from "../types";

const useStyles = makeStyles({
  card: {
    ...shorthands.padding("12px", "16px"),
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: tokens.colorNeutralStroke3,
    cursor: "pointer",
    transitionProperty: "background-color",
    transitionDuration: "0.1s",
    transitionTimingFunction: "ease",
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: "transparent",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  cardLast: {
    borderBottomStyle: "none",
  },
  highlightMultitask: {
    borderLeftColor: tokens.colorStatusDangerForeground1,
    backgroundColor: tokens.colorStatusDangerBackground1,
    "&:hover": {
      backgroundColor: tokens.colorStatusDangerBackground1,
    },
  },
  highlightTransitions: {
    borderLeftColor: tokens.colorStatusWarningForeground1,
    backgroundColor: tokens.colorStatusWarningBackground1,
    "&:hover": {
      backgroundColor: tokens.colorStatusWarningBackground1,
    },
  },
  highlightDebordement: {
    borderLeftColor: tokens.colorStatusDangerForeground1,
    backgroundColor: tokens.colorStatusDangerBackground1,
    "&:hover": {
      backgroundColor: tokens.colorStatusDangerBackground1,
    },
  },
  highlightDeepwork: {
    borderLeftColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2,
    },
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "6px",
    columnGap: "12px",
  },
  name: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "20px",
  },
  summary: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  summaryGood: { color: tokens.colorStatusSuccessForeground1 },
  summaryWarn: { color: tokens.colorStatusWarningForeground1 },
  summaryBad: { color: tokens.colorStatusDangerForeground1 },
  summaryNeutral: { color: tokens.colorBrandForeground1 },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...shorthands.padding("3px", 0, "3px", "12px"),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  rowLabel: { flex: 1 },
  rowStatus: {
    flexShrink: 0,
    marginLeft: "8px",
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
  },
  statusOk: { color: tokens.colorStatusSuccessForeground1 },
  statusNok: { color: tokens.colorStatusDangerForeground1 },
  statusAlert: { color: tokens.colorStatusWarningForeground1 },
  more: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorBrandForeground1,
    cursor: "pointer",
    fontWeight: tokens.fontWeightMedium,
    ...shorthands.padding("4px", 0, 0, "12px"),
    "&:hover": {
      textDecorationLine: "underline",
    },
  },
});

interface FactorCardProps {
  factor: Factor;
  isLast: boolean;
  onHover: (type: FactorType | null) => void;
}

const FactorCard: React.FC<FactorCardProps> = ({ factor, isLast, onHover }) => {
  const styles = useStyles();

  const summaryClass = {
    good: styles.summaryGood,
    warn: styles.summaryWarn,
    bad: styles.summaryBad,
    neutral: styles.summaryNeutral,
  }[factor.summaryClass];

  const highlightClass = {
    multitask: styles.highlightMultitask,
    transitions: styles.highlightTransitions,
    debordement: styles.highlightDebordement,
    deepwork: styles.highlightDeepwork,
  }[factor.type];

  const [isHovered, setIsHovered] = React.useState(false);

  const handleEnter = () => {
    setIsHovered(true);
    onHover(factor.type);
  };
  const handleLeave = () => {
    setIsHovered(false);
    onHover(null);
  };

  return (
    <div
      className={mergeClasses(
        styles.card,
        isLast && styles.cardLast,
        isHovered && highlightClass
      )}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className={styles.head}>
        <div className={styles.name}>{factor.name}</div>
        <div className={mergeClasses(styles.summary, summaryClass)}>{factor.summary}</div>
      </div>
      {factor.rows.map((row, i) => (
        <div key={i} className={styles.row}>
          <span className={styles.rowLabel}>{row.label}</span>
          <span
            className={mergeClasses(
              styles.rowStatus,
              row.statusClass === "ok" && styles.statusOk,
              row.statusClass === "nok" && styles.statusNok,
              row.statusClass === "alert" && styles.statusAlert
            )}
          >
            {row.status}
          </span>
        </div>
      ))}
      {factor.more && <div className={styles.more}>{factor.more}</div>}
    </div>
  );
};

export default FactorCard;
