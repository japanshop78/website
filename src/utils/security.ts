/**
 * Native Web Crypto API SHA-256 helper for client-side security
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// SHA-256 hash of the default passkey "japan2026"
// Pre-computed: sha256("japan2026")
export const DEFAULT_ADMIN_PASSKEY_HASH = "b181ca2307e6900f3d218dcabd221d64d0296cffbac6fa70a89815e67a3a49b1";
// Legacy passkey hash for "japan2024"
export const LEGACY_ADMIN_PASSKEY_HASH = "bcf1be4b02b7ec54b281a7434c6c0771bdd8a49a11fcfcbaf8f25e4263558bca";

// Session storage key and expiration in milliseconds (4 hours)
export const ADMIN_AUTH_SESSION_KEY = "japan_shop_admin_session_v2";
export const ADMIN_SESSION_DURATION_MS = 4 * 60 * 60 * 1000;

export interface AdminSession {
  authenticated: boolean;
  expiresAt: number;
}

export function saveAdminSession(rememberDevice: boolean): void {
  const session: AdminSession = {
    authenticated: true,
    expiresAt: Date.now() + (rememberDevice ? 30 * 24 * 60 * 60 * 1000 : ADMIN_SESSION_DURATION_MS),
  };
  const serialized = JSON.stringify(session);
  if (rememberDevice) {
    localStorage.setItem(ADMIN_AUTH_SESSION_KEY, serialized);
  } else {
    sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, serialized);
  }
}

export function verifyAdminSession(): boolean {
  try {
    const raw = sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) || localStorage.getItem(ADMIN_AUTH_SESSION_KEY);
    if (!raw) return false;
    const session: AdminSession = JSON.parse(raw);
    if (!session.authenticated || !session.expiresAt) return false;
    if (Date.now() > session.expiresAt) {
      clearAdminSession();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    localStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    // Also remove legacy keys
    sessionStorage.removeItem("japan_shop_admin_authenticated_v1");
    localStorage.removeItem("japan_shop_admin_authenticated_v1");
  } catch {
    // ignore
  }
}
