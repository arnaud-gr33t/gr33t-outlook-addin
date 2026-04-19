/**
 * Hook React pour obtenir un access token Microsoft Graph dans le dashboard
 * (contexte Teams/M365 app).
 *
 * Stratégie :
 *   1. Au montage, lit le token en cache localStorage (survit entre sessions).
 *   2. Si valide (expiresOn > now + 60s), on est "ready".
 *   3. Sinon → état "authRequired" → clic utilisateur → ouvre auth.html via
 *      microsoftTeams.authentication.authenticate (popup gérée par Teams, pas
 *      une popup navigateur bloquée par défaut).
 *   4. Le popup fait MSAL loginRedirect → revient sur auth.html → notifySuccess
 *      renvoie le token au dashboard via la callback authenticate.
 *   5. Le token est persisté en localStorage (contexte top-level Teams, pas
 *      de storage partitioning comme dans le TaskPane Office).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import * as microsoftTeams from "@microsoft/teams-js";

const STORAGE_KEY_TOKEN = "gr33t.dashboard.graphToken";
const STORAGE_KEY_EXPIRES = "gr33t.dashboard.graphTokenExpiresOn";
const EXPIRY_BUFFER_MS = 60_000;

type TokenStatus = "idle" | "loading" | "authRequired" | "ready" | "error";

export interface UseTeamsTokenResult {
  status: TokenStatus;
  token: string | null;
  error: string | null;
  signIn: () => Promise<void>;
  retry: () => void;
}

interface AuthMessage {
  type: "auth_success" | "auth_error";
  token?: string;
  expiresOn?: string;
  message?: string;
}

function readCached(): { token: string; expiresOn: Date } | null {
  try {
    const t = localStorage.getItem(STORAGE_KEY_TOKEN);
    const e = localStorage.getItem(STORAGE_KEY_EXPIRES);
    if (!t || !e) return null;
    const expiresOn = new Date(e);
    if (Number.isNaN(expiresOn.getTime())) return null;
    if (expiresOn.getTime() - Date.now() < EXPIRY_BUFFER_MS) return null;
    return { token: t, expiresOn };
  } catch {
    return null;
  }
}

function persist(token: string, expiresOn: Date | null): void {
  try {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    if (expiresOn) {
      localStorage.setItem(STORAGE_KEY_EXPIRES, expiresOn.toISOString());
    }
  } catch {
    /* noop */
  }
}

function clearCached(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRES);
  } catch {
    /* noop */
  }
}

export function useTeamsToken(): UseTeamsTokenResult {
  const [status, setStatus] = useState<TokenStatus>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const checkCached = useCallback(() => {
    const cached = readCached();
    if (cached) {
      setToken(cached.token);
      setStatus("ready");
    } else {
      setStatus("authRequired");
    }
  }, []);

  const adoptCachedToken = useCallback((): boolean => {
    const cached = readCached();
    if (cached && mounted.current) {
      setToken(cached.token);
      setStatus("ready");
      return true;
    }
    return false;
  }, []);

  const signIn = useCallback(async (): Promise<void> => {
    setStatus("loading");
    setError(null);
    try {
      const authUrl =
        window.location.origin +
        window.location.pathname.replace(/[^/]*$/, "") +
        "auth.html";

      const result = await microsoftTeams.authentication.authenticate({
        url: authUrl,
        width: 600,
        height: 600,
      });

      if (!mounted.current) return;
      const data = JSON.parse(result) as AuthMessage;
      if (data.type === "auth_success" && data.token) {
        const expiresOn = data.expiresOn ? new Date(data.expiresOn) : null;
        persist(data.token, expiresOn);
        setToken(data.token);
        setStatus("ready");
      } else {
        setError(data.message || "Authentification échouée");
        setStatus("error");
      }
    } catch (err) {
      if (!mounted.current) return;
      // Fallback localStorage : auth.html a persisté le token avant de
      // tenter notifySuccess. Si ça a échoué (popup Teams a perdu son
      // contexte après redirect Microsoft), le token est quand même là.
      if (adoptCachedToken()) return;

      const msg = (err as Error).message || String(err);
      // Si l'utilisateur a fermé le popup, retour en authRequired plutôt qu'en erreur
      if (/CancelledByUser|cancel/i.test(msg)) {
        setStatus("authRequired");
      } else {
        setError(msg);
        setStatus("error");
      }
    }
  }, [adoptCachedToken]);

  useEffect(() => {
    mounted.current = true;
    checkCached();
    // Storage event : déclenché quand le popup auth.html écrit le token
    // en localStorage. Nécessaire car `microsoftTeams.authentication.authenticate`
    // ne résout parfois pas sa promesse si le SDK Teams a perdu son contexte
    // après un redirect MSAL (fréquent sur Outlook Web).
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_TOKEN && e.newValue) {
        adoptCachedToken();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      mounted.current = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [checkCached, adoptCachedToken]);

  return {
    status,
    token,
    error,
    signIn,
    retry: checkCached,
  };
}

/** Exposé pour purge manuelle après 401. */
export function clearTeamsToken(): void {
  clearCached();
}
