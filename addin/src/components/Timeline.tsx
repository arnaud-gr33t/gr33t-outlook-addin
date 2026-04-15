import * as React from "react";
import { makeStyles, tokens, shorthands } from "@fluentui/react-components";
import type { TimelineData, FactorType } from "../types";
import { TL_START, TL_END, TL_HEIGHT, hourToY, durationToH, fmtH } from "../utils/timeline";

const useStyles = makeStyles({
  wrap: {
    display: "flex",
    ...shorthands.padding("12px", "10px", "12px", 0),
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  hours: {
    width: "32px",
    flexShrink: 0,
    ...shorthands.padding(0, "4px", 0, "8px"),
    position: "relative",
    height: `${TL_HEIGHT}px`,
  },
  hourLabel: {
    position: "absolute",
    fontSize: "10px",
    color: tokens.colorNeutralForeground3,
    textAlign: "right",
    lineHeight: 1,
    right: "4px",
  },
  track: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    position: "relative",
    backgroundColor: tokens.colorNeutralBackground2,
    borderTopWidth: "1px",
    borderRightWidth: "1px",
    borderBottomWidth: "1px",
    borderLeftWidth: "1px",
    borderTopStyle: "solid",
    borderRightStyle: "solid",
    borderBottomStyle: "solid",
    borderLeftStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke2,
    borderRightColor: tokens.colorNeutralStroke2,
    borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2,
    borderTopLeftRadius: tokens.borderRadiusMedium,
    borderTopRightRadius: tokens.borderRadiusMedium,
    borderBottomLeftRadius: tokens.borderRadiusMedium,
    borderBottomRightRadius: tokens.borderRadiusMedium,
    height: `${TL_HEIGHT}px`,
    overflowX: "hidden",
    overflowY: "hidden",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke3,
    pointerEvents: "none",
  },
  lunch: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${tokens.colorNeutralBackground3} 3px, ${tokens.colorNeutralBackground3} 6px)`,
    borderTopWidth: "1px",
    borderTopStyle: "dashed",
    borderTopColor: tokens.colorNeutralStroke2,
    borderBottomWidth: "1px",
    borderBottomStyle: "dashed",
    borderBottomColor: tokens.colorNeutralStroke2,
    pointerEvents: "none",
    zIndex: 1,
  },
  lunchLabel: {
    position: "absolute",
    right: "4px",
    top: "1px",
    fontSize: "9px",
    color: tokens.colorNeutralForegroundDisabled,
    fontStyle: "italic",
  },
  event: {
    position: "absolute",
    left: "4px",
    right: "4px",
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    ...shorthands.padding("2px", "6px"),
    fontSize: "10px",
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.overflow("hidden"),
    zIndex: 3,
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    lineHeight: "1.2",
  },
  evName: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  evTime: {
    fontSize: "9px",
    fontWeight: tokens.fontWeightRegular,
    opacity: 0.75,
  },
  evBlue: { backgroundColor: "#DFF6FE", borderLeftColor: "#0078D4", color: "#004578" },
  evPurple: { backgroundColor: "#EFDFF4", borderLeftColor: "#881798", color: "#4B0866" },
  evTeal: { backgroundColor: "#DFF6DD", borderLeftColor: "#107C10", color: "#0B5A08" },

  // Overlay container (one per FactorType, always in DOM, opacity controlled)
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 0.15s ease",
  },
  overlayVisible: {
    opacity: 1,
  },

  // Overlay zones
  zoneDeepwork: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(15,108,189,0.12) 4px, rgba(15,108,189,0.12) 8px)`,
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorBrandStroke2,
  },
  zoneDeepworkLabel: {
    position: "absolute",
    left: "8px",
    fontSize: "9px",
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.padding("1px", "5px"),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
  zoneTransition: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: tokens.colorStatusWarningBackground1,
    borderTopWidth: "2px",
    borderTopStyle: "dashed",
    borderTopColor: tokens.colorStatusWarningForeground1,
    borderBottomWidth: "1px",
    borderBottomStyle: "dashed",
    borderBottomColor: tokens.colorStatusWarningForeground1,
  },
  zoneTransitionLabel: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "9px",
    color: tokens.colorStatusWarningForeground1,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding("1px", "5px"),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    ...shorthands.border("1px", "solid", tokens.colorStatusWarningBorder1),
    whiteSpace: "nowrap",
  },
  zoneMultitask: {
    position: "absolute",
    left: 0,
    right: 0,
    ...shorthands.border("2px", "solid", tokens.colorStatusDangerForeground1),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    backgroundColor: tokens.colorStatusDangerBackground1,
  },
  zoneMultitaskLabel: {
    position: "absolute",
    right: "4px",
    fontSize: "9px",
    color: tokens.colorStatusDangerForeground1,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding("1px", "5px"),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    ...shorthands.border("1px", "solid", tokens.colorStatusDangerBorder1),
  },
  zoneOvertime: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: tokens.colorStatusDangerBackground1,
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorStatusDangerBorder1,
  },
  zoneOvertimeLabel: {
    position: "absolute",
    left: "8px",
    fontSize: "9px",
    color: tokens.colorStatusDangerForeground1,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding("1px", "5px"),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    ...shorthands.border("1px", "solid", tokens.colorStatusDangerBorder1),
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: tokens.colorNeutralForegroundDisabled,
    fontSize: "12px",
  },
});

interface TimelineProps {
  timeline: TimelineData | null;
  hoveredFactor: FactorType | null;
}

/**
 * Mini-timeline verticale 8h-21h avec événements et overlays sémantiques.
 * Les overlays sont toujours dans le DOM, leur visibilité est pilotée par `hoveredFactor`
 * via une transition d'opacité (évite le flicker lors du hover).
 */
const Timeline: React.FC<TimelineProps> = ({ timeline, hoveredFactor }) => {
  const styles = useStyles();

  // Mapping direct variant → classe CSS (résolu APRÈS styles = useStyles())
  const eventVariantClass: Record<string, string> = {
    blue: styles.evBlue,
    purple: styles.evPurple,
    teal: styles.evTeal,
  };

  // Labels d'heures (8h, 9h, ..., 21h)
  const hours: number[] = [];
  for (let h = TL_START; h <= TL_END; h++) hours.push(h);

  // Lignes de grille (intérieures, entre les labels)
  const gridLines: number[] = [];
  for (let h = TL_START + 1; h < TL_END; h++) gridLines.push(h);

  return (
    <div className={styles.wrap}>
      <div className={styles.hours}>
        {hours.map((h) => (
          <span key={h} className={styles.hourLabel} style={{ top: `${hourToY(h) - 4}px` }}>
            {h}h
          </span>
        ))}
      </div>
      <div className={styles.track}>
        {timeline === null ? (
          <div className={styles.emptyState}>Pas de données</div>
        ) : (
          <>
            {/* Grid lines */}
            {gridLines.map((h) => (
              <div key={h} className={styles.gridLine} style={{ top: `${hourToY(h)}px` }} />
            ))}

            {/* Lunch band (12h30 - 13h30) */}
            <div
              className={styles.lunch}
              style={{
                top: `${hourToY(12.5)}px`,
                height: `${durationToH(12.5, 13.5)}px`,
              }}
            >
              <span className={styles.lunchLabel}>pause</span>
            </div>

            {/* Events */}
            {timeline.events.map((ev, i) => {
              const top = hourToY(ev.start);
              const height = durationToH(ev.start, ev.end);
              const variantClass = eventVariantClass[ev.variant] ?? "";
              // Surcharge éventuelle de la couleur de bordure gauche
              // selon la conformité aux facteurs Multi-tâche / Transition.
              const borderOverride = ev.borderTone
                ? {
                    borderLeftColor:
                      ev.borderTone === "good"
                        ? tokens.colorStatusSuccessForeground1
                        : ev.borderTone === "warn"
                        ? tokens.colorStatusWarningForeground1
                        : tokens.colorStatusDangerForeground1,
                  }
                : undefined;
              return (
                <div
                  key={`ev-${i}`}
                  className={`${styles.event} ${variantClass}`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    ...borderOverride,
                  }}
                >
                  {ev.name && <div className={styles.evName}>{ev.name}</div>}
                  {height > 20 && ev.name && (
                    <div className={styles.evTime}>
                      {fmtH(ev.start)} – {fmtH(ev.end)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Overlays — always mounted, opacity pilotée */}
            {/* Multitask */}
            <div
              className={`${styles.overlay} ${hoveredFactor === "multitask" ? styles.overlayVisible : ""}`}
            >
              {timeline.overlays.multitask.map((z, i) => {
                const top = hourToY(z.start);
                const height = Math.max(durationToH(z.start, z.end), 6);
                return (
                  <React.Fragment key={`mt-${i}`}>
                    <div
                      className={styles.zoneMultitask}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    />
                    <div className={styles.zoneMultitaskLabel} style={{ top: `${top + 2}px` }}>
                      {z.label}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Transitions */}
            <div
              className={`${styles.overlay} ${hoveredFactor === "transitions" ? styles.overlayVisible : ""}`}
            >
              {timeline.overlays.transitions.map((z, i) => {
                const top = hourToY(z.start);
                const height = Math.max(durationToH(z.start, z.end), 12);
                return (
                  <React.Fragment key={`tr-${i}`}>
                    <div
                      className={styles.zoneTransition}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    />
                    <div className={styles.zoneTransitionLabel} style={{ top: `${top + 1}px` }}>
                      {z.label}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Débordement (overtime) */}
            <div
              className={`${styles.overlay} ${hoveredFactor === "debordement" ? styles.overlayVisible : ""}`}
            >
              {timeline.overlays.debordement.map((z, i) => {
                const top = hourToY(z.start);
                const height = Math.max(durationToH(z.start, z.end), 6);
                return (
                  <React.Fragment key={`db-${i}`}>
                    <div
                      className={styles.zoneOvertime}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    />
                    <div
                      className={styles.zoneOvertimeLabel}
                      style={{ top: `${top + Math.max(height - 14, 2)}px` }}
                    >
                      {z.label}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Deepwork */}
            <div
              className={`${styles.overlay} ${hoveredFactor === "deepwork" ? styles.overlayVisible : ""}`}
            >
              {timeline.overlays.deepwork.map((z, i) => {
                const top = hourToY(z.start);
                const height = Math.max(durationToH(z.start, z.end), 6);
                return (
                  <React.Fragment key={`dw-${i}`}>
                    <div
                      className={styles.zoneDeepwork}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    />
                    <div className={styles.zoneDeepworkLabel} style={{ top: `${top + 2}px` }}>
                      {z.label}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Timeline;
