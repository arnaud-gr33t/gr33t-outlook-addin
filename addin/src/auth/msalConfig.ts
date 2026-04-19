/**
 * Configuration MSAL pour le TaskPane (SPA / browser).
 *
 * Le TaskPane tourne dans une iframe Outlook (Web, Desktop, Mobile).
 * On utilise MSAL browser avec un popup de consent à la 1ère ouverture,
 * puis des refresh silencieux.
 */
import type { Configuration } from "@azure/msal-browser";

const CLIENT_ID = "db7277cc-f16f-4739-9358-33fc327bcd28";
const TENANT_ID = "7ea6c456-b138-449f-a20e-1b11403d7a6b";

/**
 * Scopes Graph :
 *   - Calendars.Read : lire le calendrier principal + Gr33t Recovery
 *   - Mail.ReadBasic : détecter les envois de mail (headers only,
 *                       sans exposer le contenu) pour les facteurs IRA
 *                       Concentration / Horaires / Focus
 *   - User.Read      : profil de base
 */
export const GRAPH_SCOPES = [
  "Calendars.Read",
  "Mail.ReadBasic",
  "User.Read",
];

/**
 * Redirect URI dérivé de la page courante :
 * - Depuis le TaskPane : .../taskpane.html
 * - Depuis le dialog d'auth : .../auth.html
 *
 * Les deux URIs doivent être déclarés comme plateforme SPA dans l'App Registration Azure.
 */
function getRedirectUri(): string {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  // On nettoie un éventuel query string / hash et on garde le pathname tel quel
  // (taskpane.html ou auth.html selon le contexte d'exécution).
  if (pathname.endsWith("auth.html") || pathname.endsWith("taskpane.html")) {
    return `${origin}${pathname}`;
  }
  // Fallback : on suppose taskpane.html à la racine du déploiement
  const dir = pathname.replace(/[^/]*$/, "");
  return `${origin}${dir}taskpane.html`;
}

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: getRedirectUri(),
    postLogoutRedirectUri: getRedirectUri(),
  },
  cache: {
    // localStorage : le refresh token MSAL survit à la fermeture du dialog
    // d'auth Office. À chaque ouverture suivante du dialog, MSAL utilise ce
    // refresh token pour obtenir un nouvel access token sans re-prompt
    // utilisateur. Refresh token valide ~90 jours (rolling).
    cacheLocation: "localStorage",
  },
};
