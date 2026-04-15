/**
 * Auth dialog — exécutée dans une fenêtre séparée ouverte par
 * Office.context.ui.displayDialogAsync depuis le TaskPane.
 *
 * Cette fenêtre n'est PAS une iframe imbriquée → MSAL loginPopup fonctionne ici.
 * Le résultat (token ou erreur) est renvoyé au TaskPane via Office.context.ui.messageParent.
 */
import { PublicClientApplication } from "@azure/msal-browser";
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

function postToParent(msg: AuthMessage): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Office as any).context.ui.messageParent(JSON.stringify(msg));
  } catch (e) {
    console.error("[auth] messageParent failed:", e);
  }
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
      postToParent({
        type: "auth_success",
        token: redirectResult.accessToken,
        expiresOn: redirectResult.expiresOn?.toISOString(),
      });
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
        postToParent({
          type: "auth_success",
          token: silent.accessToken,
          expiresOn: silent.expiresOn?.toISOString(),
        });
        return;
      } catch {
        // Fall through
      }
    }

    // Cette fenêtre EST une vraie fenêtre (pas une iframe imbriquée),
    // donc loginPopup fonctionne... mais ouvrir une popup depuis une popup
    // peut être bloqué par certains navigateurs. On utilise loginRedirect
    // qui navigue cette fenêtre dialog vers Microsoft puis revient.
    await msal.loginRedirect({ scopes: GRAPH_SCOPES });
    // À ce point la page a navigué, run() ne reprend pas la main
  } catch (err) {
    const message = (err as Error).message || String(err);
    console.error("[auth] failure:", err);
    showError(message);
    postToParent({ type: "auth_error", message });
  }
}

// Démarre dès qu'Office.js est prêt
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const officeAny = (typeof Office !== "undefined" ? (Office as any) : undefined);
if (officeAny?.onReady) {
  officeAny.onReady(() => {
    void run();
  });
} else {
  // Si Office n'est pas dispo (test direct), démarre quand même
  void run();
}
