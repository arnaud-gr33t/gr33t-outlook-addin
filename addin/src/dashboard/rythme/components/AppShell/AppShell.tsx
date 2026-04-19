import * as React from "react";
import { useEffect, useState } from "react";
import styles from "./AppShell.module.css";
import { Topbar } from "../Topbar/Topbar";
import { Tabs, TabKey } from "../Tabs/Tabs";
import { useDashboardData } from "../../data/data-provider";

export interface AppShellProps {
  /** Rendu du contenu de l'onglet "rythme". */
  rythmeContent: React.ReactNode;
}

const MIN_WIDTH = 1100;

/**
 * AppShell : Topbar + Tabs + conteneur d'onglets.
 * Affiche un message si la fenêtre est trop étroite (< 1100 px).
 */
export const AppShell: React.FC<AppShellProps> = ({ rythmeContent }) => {
  const [active, setActive] = useState<TabKey>("rythme");
  const [narrow, setNarrow] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < MIN_WIDTH : false
  );
  const { referenceDate } = useDashboardData();

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < MIN_WIDTH);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (narrow) {
    return (
      <div className={styles.narrowGuard}>
        <div>
          <strong>Veuillez élargir le volet</strong>
          Le dashboard Rythme nécessite au moins 1100 px de large pour afficher
          les 3 semaines de timeline.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <Topbar referenceDate={referenceDate} />
      <Tabs active={active} onChange={setActive} />
      <main className={styles.content}>
        <div className={`${styles.pane} ${active === "rythme" ? styles.active : ""}`}>
          {rythmeContent}
        </div>
        <div
          className={`${styles.pane} ${active === "accompagnement" ? styles.active : ""}`}
          role="tabpanel"
        />
        <div
          className={`${styles.pane} ${active === "qvct" ? styles.active : ""}`}
          role="tabpanel"
        />
      </main>
    </div>
  );
};
