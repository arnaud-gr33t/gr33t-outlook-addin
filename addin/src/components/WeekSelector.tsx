import * as React from "react";
import { makeStyles, tokens, mergeClasses, shorthands } from "@fluentui/react-components";
import type { WeekData } from "../types";
import { scoreBand } from "../utils/timeline";

const useStyles = makeStyles({
  container: {
    display: "flex",
    columnGap: "4px",
    ...shorthands.padding("12px", "16px"),
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: tokens.colorNeutralStroke2,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: {
    ...shorthands.flex(1, 1, "0"),
    ...shorthands.padding("8px", "2px", "6px", "2px"),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: "pointer",
    textAlign: "center",
    transitionProperty: "all",
    transitionDuration: "0.1s",
    transitionTimingFunction: "ease",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderTopColor: tokens.colorNeutralStroke1,
      borderRightColor: tokens.colorNeutralStroke1,
      borderBottomColor: tokens.colorNeutralStroke1,
      borderLeftColor: tokens.colorNeutralStroke1,
    },
  },
  cardActive: {
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
    borderBottomColor: tokens.colorBrandStroke1,
    borderLeftColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2,
      borderTopColor: tokens.colorBrandStroke1,
      borderRightColor: tokens.colorBrandStroke1,
      borderBottomColor: tokens.colorBrandStroke1,
      borderLeftColor: tokens.colorBrandStroke1,
    },
  },
  cardFuture: {
    opacity: 0.55,
    cursor: "not-allowed",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1,
      borderTopColor: tokens.colorNeutralStroke2,
      borderRightColor: tokens.colorNeutralStroke2,
      borderBottomColor: tokens.colorNeutralStroke2,
      borderLeftColor: tokens.colorNeutralStroke2,
    },
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  num: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: "20px",
  },
  numActive: {
    color: tokens.colorBrandForeground1,
  },
  score: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  scoreGood: { color: tokens.colorStatusSuccessForeground1 },
  scoreWarn: { color: tokens.colorStatusWarningForeground1 },
  scoreBad: { color: tokens.colorStatusDangerForeground1 },
  scoreFuture: { color: tokens.colorNeutralForegroundDisabled },
  bar: {
    height: "3px",
    backgroundColor: tokens.colorNeutralBackground5,
    ...shorthands.borderRadius("2px"),
    ...shorthands.overflow("hidden"),
    marginTop: "4px",
    marginLeft: "6px",
    marginRight: "6px",
  },
  barFill: {
    height: "100%",
    ...shorthands.borderRadius("2px"),
  },
  fillGood: { backgroundColor: tokens.colorStatusSuccessForeground1 },
  fillWarn: { backgroundColor: tokens.colorStatusWarningForeground1 },
  fillBad: { backgroundColor: tokens.colorStatusDangerForeground1 },
});

interface WeekSelectorProps {
  weekData: WeekData;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Barre de sélection des 5 jours de la semaine (Lun-Ven).
 * Le jour actif est en brandBackground2, les jours futurs sont grisés.
 */
const WeekSelector: React.FC<WeekSelectorProps> = ({ weekData, selectedIndex, onSelect }) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {weekData.map((day, idx) => {
        const isActive = idx === selectedIndex;
        const isFuture = day.score.score === null;
        const band = scoreBand(day.score.score);

        const scoreClass = {
          good: styles.scoreGood,
          warn: styles.scoreWarn,
          bad: styles.scoreBad,
          future: styles.scoreFuture,
        }[band];

        const fillClass = {
          good: styles.fillGood,
          warn: styles.fillWarn,
          bad: styles.fillBad,
          future: "",
        }[band];

        const handleClick = () => {
          if (!isFuture) onSelect(idx);
        };

        return (
          <div
            key={day.score.weekday}
            className={mergeClasses(
              styles.card,
              isActive && styles.cardActive,
              isFuture && styles.cardFuture
            )}
            onClick={handleClick}
            role="button"
            tabIndex={isFuture ? -1 : 0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isFuture) {
                e.preventDefault();
                onSelect(idx);
              }
            }}
          >
            <div className={styles.label}>{day.score.weekday}</div>
            <div className={mergeClasses(styles.num, isActive && styles.numActive)}>
              {day.score.dayNum}
            </div>
            <div className={mergeClasses(styles.score, scoreClass)}>
              {day.score.score !== null ? `${day.score.score}%` : "—"}
            </div>
            <div className={styles.bar}>
              <div
                className={mergeClasses(styles.barFill, fillClass)}
                style={{ width: `${day.score.score ?? 0}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeekSelector;
