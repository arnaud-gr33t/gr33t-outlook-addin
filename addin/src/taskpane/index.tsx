import * as React from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import App from "../components/App";
import "./taskpane.css";

/* global document, Office */

// Le TaskPane doit attendre que Office.js soit prêt avant de monter React.
// Référence : https://learn.microsoft.com/en-us/office/dev/add-ins/develop/initialize-add-in
Office.onReady(() => {
  const container = document.getElementById("container");
  if (!container) {
    // eslint-disable-next-line no-console
    console.error("[Gr33t] Container element #container not found in taskpane.html");
    return;
  }

  const root = createRoot(container);
  root.render(
    <FluentProvider theme={webLightTheme}>
      <App />
    </FluentProvider>
  );
});
