// auth.js — Google OAuth via @convex-dev/auth
import { ConvexClient } from "https://esm.sh/convex@1.34.1/browser";

export const CONVEX_URL = "https://shiny-setter-795.eu-west-1.convex.cloud";
export const client = new ConvexClient(CONVEX_URL);

// ───────────────────────────────────────────
// Google OAuth — Redirect-Fluss
// ───────────────────────────────────────────

export async function signInWithGoogle() {
  const redirectTo = encodeURIComponent(window.location.href.split('?')[0]);
  window.location.href = `${CONVEX_URL}/api/auth/signin/google?redirectTo=${redirectTo}`;
}

export async function signOut() {
  try {
    const token = getStoredToken();
    if (token) {
      await fetch(`${CONVEX_URL}/api/auth/signout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch (_) { /* ignorieren */ }
  clearStoredUser();
  client.setAuth(async () => null);
}

// ───────────────────────────────────────────
// App-Start: Auth prüfen (Token aus URL oder localStorage)
// ───────────────────────────────────────────

export async function initAuth() {
  // 1. Token aus URL-Params nach OAuth-Redirect
  const params = new URLSearchParams(window.location.search);
  const code  = params.get('code');
  const state = params.get('state');

  if (code && state) {
    try {
      const res = await fetch(
        `${CONVEX_URL}/api/auth/callback/google?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          storeToken(data.token);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    } catch (e) {
      console.error('Auth callback Fehler:', e);
    }
  }

  // 2. Token aus localStorage → Convex Client authentifizieren
  const token = getStoredToken();
  if (token) {
    client.setAuth(async () => token);
    try {
      const profile = await client.query("users:getProfile", {});
      if (profile) {
        storeUser(profile);
        return profile;
      }
    } catch (e) {
      console.warn('Token ungültig, neu anmelden.');
      clearStoredUser();
    }
  }
  return null;
}

export function getCurrentUser() {
  const stored = localStorage.getItem('filmduel_user');
  return stored ? JSON.parse(stored) : null;
}

export function getAuthToken() {
  return getStoredToken();
}

// ───────────────────────────────────────────
// Hilfsfunktionen (privat)
// ───────────────────────────────────────────

function getStoredToken() {
  return localStorage.getItem('filmduel_token');
}

function storeToken(token) {
  localStorage.setItem('filmduel_token', token);
}

function storeUser(user) {
  localStorage.setItem('filmduel_user', JSON.stringify(user));
}

function clearStoredUser() {
  localStorage.removeItem('filmduel_token');
  localStorage.removeItem('filmduel_user');
}
