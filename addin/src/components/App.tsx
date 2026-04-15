import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Toaster,
  useId,
  useToastController,
  Toast,
  ToastTitle,
} from "@fluentui/react-components";
import type { FactorType } from "../types";
import { useGraphToken } from "../auth/useGraphToken";
import { fetchTodayRecovery } from "../calendar/calendarReader";
import {
  recoveryToDayScore,
  type RecoveryAdaptedData,
} from "../adapters/recoveryToDayScore";
import TaskPane from "./TaskPane";

/**
 * Composant racine du TaskPane Gr33t.
 *
 * Récupère via MSAL browser un token Graph, lit le score du jour depuis
 * le calendrier "Gr33t Recovery", et descend les données au TaskPane.
 */

type DataStatus = "idle" | "loading" | "ready" | "empty" | "error";

const App: React.FC = () => {
  const [hoveredFactor, setHoveredFactor] = useState<FactorType | null>(null);
  const [data, setData] = useState<RecoveryAdaptedData | null>(null);
  const [dataStatus, setDataStatus] = useState<DataStatus>("idle");
  const [dataError, setDataError] = useState<string | null>(null);

  const { status: authStatus, token, error: authError, signIn, retry: retryAuth } =
    useGraphToken();

  const toasterId = useId("gr33t-toaster");
  const { dispatchToast } = useToastController(toasterId);

  // Fetch des données dès que le token est disponible
  const loadData = useCallback(
    async (accessToken: string) => {
      setDataStatus("loading");
      setDataError(null);
      try {
        const recovery = await fetchTodayRecovery(accessToken);
        if (!recovery) {
          setData(null);
          setDataStatus("empty");
          return;
        }
        setData(recoveryToDayScore(recovery));
        setDataStatus("ready");
      } catch (err) {
        const message = (err as Error).message;
        // Token invalide / expiré → purge et re-auth
        if (message.includes("401") || message.includes("Unauthorized")) {
          try {
            const officeAny = (globalThis as { Office?: { context?: { roamingSettings?: { remove(k: string): void; saveAsync(cb: () => void): void } } } }).Office;
            const roaming = officeAny?.context?.roamingSettings;
            if (roaming) {
              roaming.remove("gr33t.graphToken");
              roaming.remove("gr33t.graphTokenExpiresOn");
              roaming.saveAsync(() => {
                /* noop */
              });
            }
          } catch {
            /* noop */
          }
        }
        setDataError(message);
        setDataStatus("error");
      }
    },
    []
  );

  useEffect(() => {
    if (authStatus === "ready" && token) {
      void loadData(token);
    }
  }, [authStatus, token, loadData]);

  const handleHoverFactor = useCallback((type: FactorType | null) => {
    setHoveredFactor(type);
  }, []);

  const handleClose = useCallback(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const officeAny = Office as any;
      if (officeAny?.addin?.hide) {
        officeAny.addin.hide();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[Gr33t] Office.addin.hide() not available:", err);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (!token) {
      void retryAuth();
      return;
    }
    dispatchToast(
      <Toast>
        <ToastTitle>Actualisation…</ToastTitle>
      </Toast>,
      { intent: "info", timeout: 1500 }
    );
    void loadData(token);
  }, [token, retryAuth, loadData, dispatchToast]);

  return (
    <>
      <TaskPane
        authStatus={authStatus}
        authError={authError}
        dataStatus={dataStatus}
        dataError={dataError}
        data={data}
        hoveredFactor={hoveredFactor}
        onHoverFactor={handleHoverFactor}
        onClose={handleClose}
        onRefresh={handleRefresh}
        onSignIn={signIn}
        onRetryAuth={retryAuth}
      />
      <Toaster toasterId={toasterId} position="bottom" />
    </>
  );
};

export default App;
