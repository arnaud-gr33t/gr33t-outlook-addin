import * as React from "react";
import { makeStyles, tokens, shorthands } from "@fluentui/react-components";

const useStyles = makeStyles({
  section: {
    ...shorthands.padding("14px", "16px"),
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke2,
  },
  title: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: "8px",
    color: tokens.colorNeutralForeground1,
  },
  chart: {
    height: "72px",
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.padding("6px"),
  },
  svg: {
    width: "100%",
    height: "100%",
  },
});

/**
 * Courbe de tendance des scores sur 3 semaines.
 * Jalon 1 : données en dur (SVG statique reproduisant mockup-D.html).
 * Phase ultérieure : données historiques réelles depuis le stockage local.
 */
const TrendChart: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Tendance — 3 semaines</h3>
      <div className={styles.chart}>
        <svg viewBox="0 0 260 60" className={styles.svg}>
          {/* Grid lines */}
          <line
            x1="15"
            y1="12"
            x2="255"
            y2="12"
            stroke={tokens.colorNeutralStroke2}
            strokeWidth="0.5"
            strokeDasharray="3"
          />
          <line
            x1="15"
            y1="30"
            x2="255"
            y2="30"
            stroke={tokens.colorNeutralStroke2}
            strokeWidth="0.5"
            strokeDasharray="3"
          />
          <line
            x1="15"
            y1="48"
            x2="255"
            y2="48"
            stroke={tokens.colorNeutralStroke2}
            strokeWidth="0.5"
            strokeDasharray="3"
          />
          {/* Y axis labels */}
          <text x="0" y="14" fontSize="5" fill="#616161">
            100
          </text>
          <text x="3" y="32" fontSize="5" fill="#616161">
            50
          </text>
          <text x="6" y="50" fontSize="5" fill="#616161">
            0
          </text>
          {/* Line */}
          <path
            d="M20,24 L40,28 L55,22 L70,26 L90,24 L110,30 L130,20 L150,26 L170,24 L190,22 L210,19 L230,17 L248,15"
            fill="none"
            stroke={tokens.colorBrandBackground}
            strokeWidth="1.5"
          />
          {/* Filled area */}
          <path
            d="M20,24 L40,28 L55,22 L70,26 L90,24 L110,30 L130,20 L150,26 L170,24 L190,22 L210,19 L230,17 L248,15 L248,52 L20,52 Z"
            fill={tokens.colorBrandBackground}
            opacity="0.08"
          />
          {/* Last point */}
          <circle cx="248" cy="15" r="2.5" fill={tokens.colorBrandBackground} />
          <text x="238" y="11" fontSize="5" fill={tokens.colorBrandBackground} fontWeight="bold">
            72
          </text>
          {/* X axis labels */}
          <text x="20" y="57" fontSize="4" fill="#616161">
            16/3
          </text>
          <text x="90" y="57" fontSize="4" fill="#616161">
            23/3
          </text>
          <text x="165" y="57" fontSize="4" fill="#616161">
            30/3
          </text>
          <text x="238" y="57" fontSize="4" fill="#616161">
            7/4
          </text>
        </svg>
      </div>
    </div>
  );
};

export default TrendChart;
