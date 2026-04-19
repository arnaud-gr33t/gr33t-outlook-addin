import * as React from "react";
import styles from "./Tabs.module.css";

export type TabKey = "rythme" | "accompagnement" | "qvct";

export interface TabsProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

interface TabDef {
  key: TabKey;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { key: "rythme", label: "Mon rythme", icon: "monitoring" },
  { key: "accompagnement", label: "Accompagnement", icon: "support_agent" },
  { key: "qvct", label: "Politique QVCT", icon: "diversity_3" },
];

export const Tabs: React.FC<TabsProps> = ({ active, onChange }) => {
  return (
    <nav className={styles.tabs} role="tablist">
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ""}`}
            onClick={() => onChange(t.key)}
          >
            <span className="material-symbols-rounded" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
};
