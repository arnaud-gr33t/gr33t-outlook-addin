import * as React from "react";
import { makeStyles, tokens, Button, mergeClasses, shorthands } from "@fluentui/react-components";
import { Dismiss20Regular } from "@fluentui/react-icons";
import type { DayScore } from "../types";
import { scoreBand } from "../utils/timeline";

const useStyles = makeStyles({
  head: {
    ...shorthands.padding("16px", "18px", "14px", "18px"),
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  headTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  dayTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "22px",
  },
  closeBtn: {
    minWidth: "32px",
    height: "32px",
    ...shorthands.padding(0),
  },
  scoreRow: {
    display: "flex",
    alignItems: "baseline",
    columnGap: "14px",
    marginBottom: "12px",
  },
  scorePct: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1,
  },
  scoreGood: { color: tokens.colorStatusSuccessForeground1 },
  scoreWarn: { color: tokens.colorStatusWarningForeground1 },
  scoreBad: { color: tokens.colorStatusDangerForeground1 },
  scoreFuture: { color: tokens.colorNeutralForegroundDisabled },
  scoreLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: "18px",
    flex: 1,
  },
  bar: {
    height: "4px",
    backgroundColor: tokens.colorNeutralBackground5,
    ...shorthands.borderRadius("2px"),
    ...shorthands.overflow("hidden"),
  },
  barFill: {
    height: "100%",
    ...shorthands.borderRadius("2px"),
    transitionProperty: "width",
    transitionDuration: "0.3s",
    transitionTimingFunction: "ease",
  },
  fillGood: { backgroundColor: tokens.colorStatusSuccessForeground1 },
  fillWarn: { backgroundColor: tokens.colorStatusWarningForeground1 },
  fillBad: { backgroundColor: tokens.colorStatusDangerForeground1 },
});

interface HeaderProps {
  day: DayScore;
  onClose: () => void;
}

/**
 * En-tête du TaskPane : titre du jour, bouton fermer, score %, label et barre de progression.
 */
const Header: React.FC<HeaderProps> = ({ day, onClose }) => {
  const styles = useStyles();
  const band = scoreBand(day.score);
  const isFuture = day.score === null;

  const scoreColorClass = {
    good: styles.scoreGood,
    warn: styles.scoreWarn,
    bad: styles.scoreBad,
    future: styles.scoreFuture,
  }[band];

  const fillColorClass = {
    good: styles.fillGood,
    warn: styles.fillWarn,
    bad: styles.fillBad,
    future: "",
  }[band];

  return (
    <div className={styles.head}>
      <div className={styles.headTop}>
        <div className={styles.dayTitle}>{day.dayLabel}</div>
        <Button
          appearance="subtle"
          icon={<Dismiss20Regular />}
          onClick={onClose}
          className={styles.closeBtn}
          aria-label="Fermer le panneau Gr33t"
        />
      </div>
      <div className={styles.scoreRow}>
        <div className={mergeClasses(styles.scorePct, scoreColorClass)}>
          {isFuture ? "—" : `${day.score}%`}
        </div>
        <div className={styles.scoreLabel}>
          {isFuture ? "Données disponibles demain" : day.scoreLabel}
        </div>
      </div>
      <div className={styles.bar}>
        {!isFuture && day.score !== null && (
          <div
            className={mergeClasses(styles.barFill, fillColorClass)}
            style={{ width: `${day.score}%` }}
          />
        )}
      </div>
    </div>
  );
};

export default Header;
