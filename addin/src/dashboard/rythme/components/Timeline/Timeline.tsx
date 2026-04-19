import * as React from "react";
import styles from "./Timeline.module.css";
import type {
  DayData,
  FocusBand,
  Meeting,
  Overflow,
  WeekData,
  WeekScore,
} from "../../types/data-contract";
import {
  FOCUS_MIN_MIN,
  durationMinutes,
  meetingSeverity,
  meetingSeverityLabel,
  multitaskLabel,
  rangeToPercent,
} from "../../utils/layout-utils";
import { formatWeekRangeFR } from "../../utils/date-utils";

// ============================================================
// WeekHeader — 3 cards d'en-tête avec dates + score/label
// ============================================================
interface WeekHeaderProps {
  week: WeekData;
}

function scoreClass(score: WeekScore): string {
  if (score.kind === "projection") return styles.projection;
  if (score.kind === "delta") {
    return score.value < 0 ? styles.deltaNeg : styles.deltaPos;
  }
  // kind === 'value' : heuristique pos/mid
  return score.value >= 70 ? styles.pos : styles.mid;
}

function formatScoreValue(score: WeekScore): string {
  if (score.kind === "delta") {
    const sign = score.value > 0 ? "+" : "";
    return `${sign}${score.value}`;
  }
  return String(score.value);
}

const WeekHeader: React.FC<WeekHeaderProps> = ({ week }) => {
  const kindLabel: Record<WeekData["kind"], string> = {
    past: `Semaine passée · S${week.weekNumber}`,
    current: `Cette semaine · S${week.weekNumber}`,
    future: `Semaine à venir · S${week.weekNumber}`,
  };
  return (
    <div className={`${styles.weekLabel} ${styles[week.kind]}`}>
      <div>
        <div className={styles.weekLabelName}>{kindLabel[week.kind]}</div>
        <div className={styles.weekLabelDates}>
          {formatWeekRangeFR(week.mondayDate)}
        </div>
      </div>
      {week.score && (
        <div className={styles.weekLabelScore}>
          <div className={`${styles.weekScoreVal} ${scoreClass(week.score)}`}>
            {formatScoreValue(week.score)}
          </div>
          <div className={styles.weekScoreLbl}>{week.score.label}</div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// EventBar — barre d'un événement (meeting ou focus)
// ============================================================
interface MeetingBarProps {
  m: Meeting;
}

const SEVERITY_TO_CLASS: Record<string, string> = {
  "meeting-blue": styles.meetingBlue,
  "meeting-orange": styles.meetingOrange,
  "meeting-red": styles.meetingRed,
  "meeting-future": styles.meetingFuture,
  "meeting-future-pending": styles.meetingFuturePending,
};

const MeetingBar: React.FC<MeetingBarProps> = ({ m }) => {
  const { left, width } = rangeToPercent(m.start, m.end);
  const sev = meetingSeverity(m);
  return (
    <div
      className={`${styles.ev} ${SEVERITY_TO_CLASS[sev] ?? ""}`}
      style={{ left: `${left}%`, width: `${width}%` }}
    >
      <div className={styles.evTip}>
        <strong>{m.title}</strong>
        <div className={styles.evTipMeta}>
          {m.start} – {m.end} · {meetingSeverityLabel(m)}
        </div>
        {!m.future && (
          <>
            <div
              className={`${styles.evTipQual} ${
                m.trans === "ok" ? styles.ok : styles.ko
              }`}
            >
              <span className="material-symbols-rounded">
                {m.trans === "ok" ? "check_circle" : "cancel"}
              </span>
              Transition : {m.trans === "ok" ? "présente" : "absente"}
            </div>
            <div
              className={`${styles.evTipQual} ${
                m.multi === 0 ? styles.ok : styles.ko
              }`}
            >
              <span className="material-symbols-rounded">
                {m.multi === 0 ? "check_circle" : "cancel"}
              </span>
              {multitaskLabel(m.multi)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// FocusBar — bande de focus (observed/opportunity/engaged)
// ============================================================
interface FocusBarProps {
  f: FocusBand;
}

const FocusBar: React.FC<FocusBarProps> = ({ f }) => {
  const dur = durationMinutes(f.start, f.end);
  if (dur < FOCUS_MIN_MIN) return null;
  const { left, width } = rangeToPercent(f.start, f.end);
  const kindClass =
    f.kind === "opportunity"
      ? styles.focusOpportunity
      : f.kind === "engaged"
      ? styles.focusEngaged
      : "";
  return (
    <div
      className={`${styles.ev} ${styles.focus} ${kindClass}`}
      style={{ left: `${left}%`, width: `${width}%` }}
    >
      <div className={styles.evTip}>
        <strong>Plage de concentration</strong>
        <div className={styles.evTipMeta}>
          {f.start} – {f.end} · {dur} min
        </div>
      </div>
    </div>
  );
};

// ============================================================
// OverflowDot — point rouge représentant N débordements nocturnes
// ============================================================
interface OverflowDotProps {
  overflows: Overflow[];
}

const OverflowDot: React.FC<OverflowDotProps> = ({ overflows }) => {
  if (overflows.length === 0) return null;
  const n = overflows.length;
  return (
    <div
      className={`${styles.ev} ${styles.overflow}`}
      style={{ left: "calc(100% - 10px)" }}
    >
      <div className={styles.evTip}>
        <strong>
          {n} débordement{n > 1 ? "s" : ""}
        </strong>
        <div className={styles.evTipMeta}>
          {overflows.map((o) => o.time).join(" · ")}
        </div>
        <div className={`${styles.evTipQual} ${styles.ko}`}>
          <span className="material-symbols-rounded">nightlight</span>
          Pendant la période de déconnexion
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DayColumn — canvas d'une journée (52px de haut, positions en %)
// ============================================================
interface DayColumnProps {
  day: DayData;
}

const DayColumn: React.FC<DayColumnProps> = ({ day }) => {
  return (
    <div className={styles.dayCol}>
      <div className={styles.dayCanvas} data-day-id={day.date}>
        <div className={styles.outZoneL} aria-hidden />
        <div className={styles.workZone} aria-hidden />
        <div className={styles.outZoneR} aria-hidden />
        {day.focusBands.map((f, i) => (
          <FocusBar key={`f${i}`} f={f} />
        ))}
        {day.meetings.map((m, i) => (
          <MeetingBar key={`m${i}`} m={m} />
        ))}
        <OverflowDot overflows={day.overflows} />
      </div>
    </div>
  );
};

// ============================================================
// Timeline racine
// ============================================================
export interface TimelineProps {
  weeks: [WeekData, WeekData, WeekData];
  /** Slot optionnel rendu sous la timeline (bulles d'annotations). */
  annotationsSlot?: React.ReactNode;
  /** Slot optionnel pour injecter des marqueurs sur un day-canvas précis. */
  markerSlot?: (date: string) => React.ReactNode;
}

export const Timeline: React.FC<TimelineProps> = ({
  weeks,
  annotationsSlot,
  markerSlot,
}) => {
  return (
    <div className={styles.rhythmTop}>
      <div className={styles.container}>
        {/* Headers de semaine (3 cards) */}
        <div className={styles.weeksHeader}>
          {weeks.map((w) => (
            <WeekHeader key={w.mondayDate} week={w} />
          ))}
        </div>

        {/* Canvas principal : labels + grille timeline */}
        <div className={styles.canvasWrap}>
          {/* Labels Lun-Ven sur 3 semaines */}
          <div className={styles.daysLabels}>
            {weeks.map((w) => (
              <div key={`lbls-${w.mondayDate}`} className={styles.weekLabelsRow}>
                {w.days.map((d) => (
                  <div
                    key={d.date}
                    className={`${styles.dayLabel} ${
                      d.isToday ? styles.today : ""
                    }`}
                  >
                    <strong>
                      {d.shortLabel} {d.dayNumber}
                    </strong>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Grille des canvas journées */}
          <div className={styles.weeksRow}>
            {weeks.map((w) => (
              <div key={`grid-${w.mondayDate}`} className={styles.weekGrid}>
                {w.days.map((d) => (
                  <React.Fragment key={d.date}>
                    <DayColumn day={d} />
                    {markerSlot?.(d.date)}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>

          {/* Slot bulles d'annotations */}
          {annotationsSlot}
        </div>

        {/* Légende */}
        <TimelineLegend />
      </div>
    </div>
  );
};

// ============================================================
// Légende (v1 = statique, basée sur phase-1 de la maquette)
// ============================================================
const TimelineLegend: React.FC = () => {
  return (
    <div className={styles.legend}>
      <div className={styles.legendItem}>
        <span
          className={styles.legendSwatch}
          style={{ background: "var(--secondary)" }}
        />
        Bonnes conditions
      </div>
      <div className={styles.legendItem}>
        <span
          className={styles.legendSwatch}
          style={{ background: "var(--intermediate)" }}
        />
        Conditions moyennes
      </div>
      <div className={styles.legendItem}>
        <span
          className={styles.legendSwatch}
          style={{ background: "var(--negative)" }}
        />
        Conditions dégradées
      </div>
      <div className={styles.legendItem}>
        <span
          className={styles.legendSwatch}
          style={{ background: "rgba(32,92,187,0.4)" }}
        />
        À venir
      </div>
      <div className={styles.legendItem}>
        <span
          className={styles.legendSwatch}
          style={{
            background: "rgba(77,173,51,0.15)",
            border: "1px dashed rgba(77,173,51,0.6)",
          }}
        />
        Plage de concentration
      </div>
      <div className={styles.legendItem}>
        <span
          className={styles.legendSwatch}
          style={{
            background: "var(--negative)",
            borderRadius: "50%",
            width: 8,
            height: 8,
          }}
        />
        Débordement
      </div>
    </div>
  );
};
