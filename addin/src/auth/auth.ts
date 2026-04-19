/**
 * Auth dialog — exécutée dans une fenêtre séparée :
 *  - Soit ouverte par Office.context.ui.displayDialogAsync depuis le TaskPane
 *    (contexte Office add-in) → notification via Office.context.ui.messageParent
 *  - Soit ouverte par microsoftTeams.authentication.authenticate depuis le
 *    dashboard (contexte Teams app) → notification via notifySuccess/notifyFailure
 *
 * Dans les deux cas la fenêtre n'est PAS une iframe imbriquée → MSAL loginRedirect
 * peut naviguer cette fenêtre vers login.microsoftonline.com puis revenir.
 */
import { PublicClientApplication } from "@azure/msal-browser";
import * as microsoftTeams from "@microsoft/teams-js";
import { msalConfig, GRAPH_SCOPES } from "./msalConfig";

// Office est globalement disponible via le script office.js chargé dans auth.html
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Office: any;

interface AuthMessage {
  type: "auth_success" | "auth_error";
  token?: string;
  /** ISO string de la date d'expiration du token. */
  expiresOn?: string;
  message?: string;
}

// Mêmes clés que useTeamsToken — permet au dashboard de récupérer le token
// même si notifySuccess échoue (cross-window via localStorage same-origin).
const DASHBOARD_TOKEN_KEY = "gr33t.dashboard.graphToken";
const DASHBOARD_TOKEN_EXPIRES_KEY = "gr33t.dashboard.graphTokenExpiresOn";

function persistTokenForDashboard(token: string, expiresOn?: string): void {
  try {
    localStorage.setItem(DASHBOARD_TOKEN_KEY, token);
    if (expiresOn) {
      localStorage.setItem(DASHBOARD_TOKEN_EXPIRES_KEY, expiresOn);
    }
  } catch {
    /* noop */
  }
}

/** Contexte d'appel : Office dialog ou Teams authenticate popup. */
type AuthContext = "office" | "teams" | "standalone";
let authContext: AuthContext = "standalone";

const AUTH_CONTEXT_STORAGE_KEY = "gr33t.auth.context";

async function detectContext(): Promise<AuthContext> {
  // Au retour d'un redirect MSAL, le popup a perdu les query params Teams,
  // donc microsoftTeams.app.initialize() peut échouer. On persiste le contexte
  // en sessionStorage avant le redirect et on le relit ici en priorité.
  try {
    const cached = sessionStorage.getItem(AUTH_CONTEXT_STORAGE_KEY);
    if (cached === "teams" || cached === "office" || cached === "standalone") {
      // Pour Teams, on doit tout de même appeler initialize (sans attendre qu'il
      // succeed) pour que notifySuccess fonctionne. On ne bloque pas dessus.
      if (cached === "teams") {
        void microsoftTeams.app.initialize().catch(() => {
          /* ignore, on tentera notifySuccess quand même */
        });
      }
      return cached;
    }
  } catch {
    /* sessionStorage indisponible */
  }

  // Tenter Teams en premier (moins intrusif que Office.onReady)
  try {
    await microsoftTeams.app.initialize();
    return "teams";
  } catch {
    // pas dans un contexte Teams
  }
  // Office ?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const officeAny = (typeof Office !== "undefined" ? (Office as any) : undefined);
  if (officeAny?.context?.ui?.messageParent) {
    return "office";
  }
  return "standalone";
}

function persistContext(ctx: AuthContext): void {
  try {
    sessionStorage.setItem(AUTH_CONTEXT_STORAGE_KEY, ctx);
  } catch {
    /* noop */
  }
}

function postToParent(msg: AuthMessage): void {
  if (authContext === "teams") {
    try {
      if (msg.type === "auth_success") {
        microsoftTeams.authentication.notifySuccess(JSON.stringify(msg));
      } else {
        microsoftTeams.authentication.notifyFailure(msg.message || "auth failed");
      }
      return;
    } catch (e) {
      console.error("[auth] Teams notifySuccess/Failure failed:", e);
    }
  }
  if (authContext === "office") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Office as any).context.ui.messageParent(JSON.stringify(msg));
      return;
    } catch (e) {
      console.error("[auth] Office messageParent failed:", e);
    }
  }
  // standalone : rien à faire, on laisse l'utilisateur voir le résultat à l'écran
  console.warn("[auth] no parent to notify (standalone):", msg);
}

function showError(message: string): void {
  const spinner = document.getElementById("spinner");
  const msg = document.getElementById("msg");
  if (spinner) spinner.style.display = "none";
  if (msg) {
    msg.className = "err";
    msg.textContent = message;
  }
}

async function run(): Promise<void> {
  try {
    const msal = new PublicClientApplication(msalConfig);
    await msal.initialize();

    // Si on revient déjà d'un redirect MSAL, on récupère le token
    const redirectResult = await msal.handleRedirectPromise();
    if (redirectResult) {
      const expiresOnIso = redirectResult.expiresOn?.toISOString();
      // Persist en localStorage (same-origin avec le dashboard) pour que
      // useTeamsToken puisse récupérer le token même si notifySuccess échoue
      // (cas fréquent : après redirect Microsoft, le popup Teams perd son
      // contexte SDK).
      persistTokenForDashboard(redirectResult.accessToken, expiresOnIso);
      postToParent({
        type: "auth_success",
        token: redirectResult.accessToken,
        expiresOn: expiresOnIso,
      });
      // Fallback : si notifySuccess a échoué (standalone ou contexte perdu),
      // fermer la fenêtre après 1s. Le dashboard détectera le token via
      // storage event ou au prochain checkCached().
      setTimeout(() => {
        try {
          window.close();
        } catch {
          /* noop */
        }
      }, 1000);
      return;
    }

    // Compte déjà en cache → silent
    const accounts = msal.getAllAccounts();
    if (accounts.length > 0) {
      try {
        const silent = await msal.acquireTokenSilent({
          account: accounts[0],
          scopes: GRAPH_SCOPES,
        });
        const expiresOnIso = silent.expiresOn?.toISOString();
        persistTokenForDashboard(silent.accessToken, expiresOnIso);
        postToParent({
          type: "auth_success",
          token: silent.accessToken,
          expiresOn: expiresOnIso,
        });
        setTimeout(() => {
          try {
            window.close();
          } catch {
            /* noop */
          }
        }, 1000);
        return;
      } catch {
        // Fall through
      }
    }

    // loginRedirect navigue cette fenêtre vers Microsoft puis revient.
    // Fiable dans tous les contextes (Teams, Office, standalone) car ne
    // déclenche pas de popup-dans-popup (qui serait bloqué par Chrome).
    await msal.loginRedirect({ scopes: GRAPH_SCOPES });
    // À ce point la page a navigué, run() ne reprend pas la main
  } catch (err) {
    const message = (err as Error).message || String(err);
    console.error("[auth] failure:", err);
    showError(message);
    postToParent({ type: "auth_error", message });
  }
}

// Détecte le contexte (Teams ou Office) puis lance le flow MSAL
(async () => {
  authContext = await detectContext();
  persistContext(authContext);
  console.log(`[auth] context = ${authContext}`);
  await run();
})();
