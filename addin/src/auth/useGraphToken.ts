/**
 * Hook React pour obtenir un access token Microsoft Graph dans un TaskPane Office.
 *
 * Stratégie :
 *   1. Au montage, on lit le token cache dans Office.context.roamingSettings
 *      (persistant entre sessions, partagé par tous les contextes Office du même add-in).
 *   2. Si présent et non expiré (avec marge 60s), on est "ready" tout de suite.
 *   3. Sinon → state "authRequired" → l'utilisateur clique → on ouvre l'auth dialog
 *      (Office.context.ui.displayDialogAsync) qui fait MSAL loginRedirect dans une
 *      vraie fenêtre, puis renvoie le token via messageParent.
 *   4. Le TaskPane reçoit le token, le persiste dans roamingSettings, set "ready".
 *
 * MSAL ne peut pas être utilisé directement dans le TaskPane (iframe imbriquée → tous
 * les flows interactifs ou silencieux échouent). On l'isole dans le dialog window.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const ROAMING_KEY_TOKEN = "gr33t.graphToken";
const ROAMING_KEY_EXPIRES = "gr33t.graphTokenExpiresOn";
/** Marge de sécurité avant expiration (ms). */
const EXPIRY_BUFFER_MS = 60_000;

type GraphTokenStatus = "idle" | "loading" | "authRequired" | "ready" | "error";

export interface UseGraphTokenResult {
  status: GraphTokenStatus;
  token: string | null;
  error: string | null;
  /** Déclenche un loginRedirect (à appeler depuis un bouton "Se connecter"). */
  signIn: () => Promise<void>;
  /** Retente l'acquisition silencieuse. */
  retry: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getOffice(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof Office !== "undefined" ? (Office as any) : undefined;
}

/** Lit le token + expiration depuis Office.context.roamingSettings. */
function readCachedToken(): { token: string; expiresOn: Date } | null {
  try {
    const roaming = getOffice()?.context?.roamingSettings;
    if (!roaming) return null;
    const token = roaming.get(ROAMING_KEY_TOKEN) as string | undefined;
    const expiresStr = roaming.get(ROAMING_KEY_EXPIRES) as string | undefined;
    if (!token || !expiresStr) return null;
    const expiresOn = new Date(expiresStr);
    if (Number.isNaN(expiresOn.getTime())) return null;
    if (expiresOn.getTime() - Date.now() < EXPIRY_BUFFER_MS) return null;
    return { token, expiresOn };
  } catch {
    return null;
  }
}

/** Persiste le token + expiration dans Office.context.roamingSettings. */
function persistToken(token: string, expiresOn: Date | null): void {
  try {
    const roaming = getOffice()?.context?.roamingSettings;
    if (!roaming) return;
    roaming.set(ROAMING_KEY_TOKEN, token);
    if (expiresOn) {
      roaming.set(ROAMING_KEY_EXPIRES, expiresOn.toISOString());
    }
    // saveAsync : roamingSettings n'est persisté qu'après cet appel
    roaming.saveAsync(() => {
      /* noop */
    });
  } catch {
    /* noop */
  }
}

/** Efface le token cache (en cas d'erreur 401 ou de logout). */
function clearCachedToken(): void {
  try {
    const roaming = getOffice()?.context?.roamingSettings;
    if (!roaming) return;
    roaming.remove(ROAMING_KEY_TOKEN);
    roaming.remove(ROAMING_KEY_EXPIRES);
    roaming.saveAsync(() => {
      /* noop */
    });
  } catch {
    /* noop */
  }
}

export function useGraphToken(): UseGraphTokenResult {
  const [status, setStatus] = useState<GraphTokenStatus>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const acquireSilent = useCallback(async (): Promise<void> => {
    setStatus("loading");
    setError(null);

    // Vérification synchrone du cache roamingSettings
    const cached = readCachedToken();
    if (cached) {
      if (!mounted.current) return;
      setToken(cached.token);
      setStatus("ready");
      return;
    }

    if (!mounted.current) return;
    setStatus("authRequired");
  }, []);

  const signIn = useCallback(async (): Promise<void> => {
    setStatus("loading");
    setError(null);

    // On ne peut pas faire loginRedirect/loginPopup depuis l'iframe du TaskPane.
    // On ouvre une fenêtre dialog Office (vraie fenêtre, pas iframe) qui contient
    // auth.html → fait la danse MSAL → renvoie le token via messageParent.
    const authUrl =
      window.location.origin +
      window.location.pathname.replace(/[^/]*$/, "") +
      "auth.html";

    return new Promise<void>((resolve) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const officeAny = (typeof Office !== "undefined" ? Office : undefined) as any;
        if (!officeAny?.context?.ui?.displayDialogAsync) {
          throw new Error("Office Dialog API indisponible");
        }

        officeAny.context.ui.displayDialogAsync(
          authUrl,
          { height: 60, width: 30, displayInIframe: false },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (asyncResult: any) => {
            if (asyncResult.status !== "succeeded") {
              if (!mounted.current) {
                resolve();
                return;
              }
              setError(asyncResult.error?.message ?? "Échec ouverture dialog");
              setStatus("error");
              resolve();
              return;
            }

            const dialog = asyncResult.value;

            // Message reçu depuis auth.html
            dialog.addEventHandler(
              officeAny.EventType.DialogMessageReceived,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              async (arg: any) => {
                try {
                  const data = JSON.parse(arg.message);
                  if (data.type === "auth_success" && data.token) {
                    // Persiste le token dans roamingSettings pour les prochaines ouvertures
                    const expiresOn = data.expiresOn
                      ? new Date(data.expiresOn)
                      : null;
                    persistToken(data.token, expiresOn);
                    if (mounted.current) {
                      setToken(data.token);
                      setStatus("ready");
                    }
                  } else {
                    if (mounted.current) {
                      setError(data.message || "Erreur d'authentification");
                      setStatus("error");
                    }
                  }
                } catch (e) {
                  if (mounted.current) {
                    setError("Réponse d'authentification invalide");
                    setStatus("error");
                  }
                }
                try {
                  dialog.close();
                } catch {
                  /* noop */
                }
                resolve();
              }
            );

            // Fermeture dialog par l'utilisateur ou erreur runtime
            dialog.addEventHandler(
              officeAny.EventType.DialogEventReceived,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (arg: any) => {
                if (!mounted.current) {
                  resolve();
                  return;
                }
                // 12006 = utilisateur a fermé le dialog
                if (arg.error === 12006) {
                  setStatus("authRequired");
                } else {
                  setError(`Dialog erreur ${arg.error}`);
                  setStatus("error");
                }
                resolve();
              }
            );
          }
        );
      } catch (err) {
        if (!mounted.current) {
          resolve();
          return;
        }
        setError((err as Error).message || "Connexion échouée");
        setStatus("error");
        resolve();
      }
    });
  }, []);

  // Tentative silencieuse au montage
  useEffect(() => {
    mounted.current = true;
    void acquireSilent();
    return () => {
      mounted.current = false;
    };
  }, [acquireSilent]);

  return { status, token, error, signIn, retry: acquireSilent };
}
