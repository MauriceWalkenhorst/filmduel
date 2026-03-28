// auth.js — Google Identity Services + Convex JWT Auth
import { ConvexClient } from "https://esm.sh/convex@1.34.1/browser";

export const CONVEX_URL = "https://shiny-setter-795.eu-west-1.convex.cloud";
export const client = new ConvexClient(CONVEX_URL);

const CLIENT_ID = "766900712587-5mf6f7iiee4klsqsq0s0r7crh03ofp9d.apps.googleusercontent.com";
const TOKEN_KEY = "filmduel_token";
const USER_KEY  = "filmduel_user";

let _currentUser = null;

// ───────────────────────────────────────────
// App-Start: gespeichertes Token wiederverwenden
// ───────────────────────────────────────────

export async function initAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  client.setAuth(async () => token);
  try {
    const profile = await client.query("users:getProfile", {});
    if (profile) {
      _currentUser = profile;
      return profile;
    }
  } catch (_) {
    // Token abgelaufen oder ungültig
    clearAuth();
  }
  return null;
}

// ───────────────────────────────────────────
// Google Sign-In Button rendern
// ───────────────────────────────────────────

export function renderGoogleButton(containerId, onSuccess) {
  const tryRender = () => {
    if (!window.google?.accounts?.id) {
      setTimeout(tryRender, 100);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (response) => {
        const token = response.credential;
        await _handleToken(token);
        onSuccess(_currentUser);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.renderButton(
      document.getElementById(containerId),
      {
        theme: "filled_black",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 280,
      }
    );
  };
  tryRender();
}

async function _handleToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  client.setAuth(async () => token);
  try {
    const profile = await client.mutation("users:getOrCreateProfile", {});
    _currentUser = profile;
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Profil-Fehler:", e);
  }
}

// ───────────────────────────────────────────
// Abmelden
// ───────────────────────────────────────────

export function signOut() {
  clearAuth();
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
}

export function getCurrentUser() {
  if (_currentUser) return _currentUser;
  // Fallback: aus localStorage lesen
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function updateCurrentUser(user) {
  _currentUser = user;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  _currentUser = null;
  client.setAuth(async () => null);
}
