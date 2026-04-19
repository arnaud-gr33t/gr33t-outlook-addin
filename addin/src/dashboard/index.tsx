import * as React from "react";
import { createRoot } from "react-dom/client";
import * as microsoftTeams from "@microsoft/teams-js";
import DashboardApp from "./DashboardApp";
import { ErrorBoundary } from "./rythme/components/ErrorBoundary";

/**
 * Point d'entrée du dashboard Gr33t — exposé via une Teams/M365 App
 * (staticTab dans le manifest Teams). Utilise le SDK Teams uniquement
 * pour signaler au host que l'app a fini de charger.
 */

async function bootstrap() {
  try {
    await microsoftTeams.app.initialize();
    microsoftTeams.app.notifySuccess();
  } catch (err) {
    // Hors Teams (ex: ouverture directe) — on continue en mode dégradé.
    // eslint-disable-next-line no-console
    console.warn("[dashboard] Teams SDK init failed:", err);
  }

  const container = document.getElementById("container");
  if (!container) throw new Error("Missing #container");
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <DashboardApp />
    </ErrorBoundary>
  );
}

void bootstrap();
