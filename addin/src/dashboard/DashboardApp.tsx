import * as React from "react";
import { DataProvider } from "./rythme/data/data-provider";
import { AppShell } from "./rythme/components/AppShell/AppShell";
import { RythmeTab } from "./rythme/RythmeTab";
import { useGraphDashboard } from "./rythme/data/useGraphDashboard";
import {
  AuthView,
  ErrorView,
  LoadingView,
} from "./rythme/components/StateView/StateView";
import { mockData } from "./rythme/data/mock-data";
import "./rythme/styles/global.css";

/**
 * Racine du dashboard Rythme (v1.5 = timeline branchée sur Graph).
 *
 * - Leviers, IRA et annotations restent en mock (mockData)
 * - weeks.days sont hydratés via Graph (recovery + réunions futures)
 *
 * Le DataProvider reçoit toujours un DashboardData complet. Pendant le
 * chargement ou en erreur, on rend l'AppShell avec un placeholder d'état
 * à la place du RythmeTab — le topbar et les tabs restent visibles.
 */
const DashboardApp: React.FC = () => {
  const { status, data, error, signIn, retry } = useGraphDashboard();

  // Choix du DashboardData à injecter dans le Provider :
  //   - ready : les vraies données fusionnées
  //   - sinon : le mock (pour que le Topbar affiche une date cohérente)
  const providerData = data ?? mockData;

  const content = (() => {
    switch (status) {
      case "loading":
        return <LoadingView />;
      case "authRequired":
        return <AuthView onSignIn={() => void signIn()} />;
      case "error":
        return <ErrorView message={error} onRetry={retry} />;
      case "ready":
        return <RythmeTab />;
    }
  })();

  return (
    <DataProvider data={providerData}>
      <AppShell rythmeContent={content} />
    </DataProvider>
  );
};

export default DashboardApp;
