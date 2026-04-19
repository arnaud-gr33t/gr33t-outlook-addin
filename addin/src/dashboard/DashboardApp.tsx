import * as React from "react";
import { DataProvider } from "./rythme/data/data-provider";
import { AppShell } from "./rythme/components/AppShell/AppShell";
import { RythmeTab } from "./rythme/RythmeTab";
import "./rythme/styles/global.css";

/**
 * Racine du dashboard Rythme (v1 = mock only).
 *
 * v2 (futur) : remplacer le DataProvider par un connecteur Microsoft Graph via
 * useTeamsToken + fetchWeekRecovery pour alimenter le Context avec les vraies
 * données calendrier/mail de l'utilisateur.
 */
const DashboardApp: React.FC = () => {
  return (
    <DataProvider>
      <AppShell rythmeContent={<RythmeTab />} />
    </DataProvider>
  );
};

export default DashboardApp;
