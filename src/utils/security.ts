/**
 * Native Web Crypto API SHA-256 helper for client-side security
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}


// Session storage key and expiration in milliseconds (4 hours)
export const ADMIN_AUTH_SESSION_KEY = "japan_shop_admin_session_v2";
export const ADMIN_SESSION_DURATION_MS = 4 * 60 * 60 * 1000;

// Brute-force protection constants (max 5 failed attempts -> 60s lockout)
const LOGIN_ATTEMPTS_KEY = "japan_shop_admin_login_attempts";
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 60 * 1000;

export interface AdminSession {
  authenticated: boolean;
  expiresAt: number;
  passkeyHash?: string;
  email?: string;
}

interface LoginAttemptState {
  count: number;
  lockUntil: number;
}

export function saveAdminSession(rememberDevice: boolean, passkeyHash?: string, email?: string): void {
  const session: AdminSession = {
    authenticated: true,
    expiresAt: Date.now() + (rememberDevice ? 30 * 24 * 60 * 60 * 1000 : ADMIN_SESSION_DURATION_MS),
    passkeyHash: passkeyHash,
    email,
  };
  const serialized = JSON.stringify(session);
  if (rememberDevice) {
    localStorage.setItem(ADMIN_AUTH_SESSION_KEY, serialized);
  } else {
    sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, serialized);
  }
  resetLoginAttempts();
}

export function verifyAdminSession(): boolean {
  if (typeof window === "undefined") return false;
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

export function getAdminPasskeyHash(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) || localStorage.getItem(ADMIN_AUTH_SESSION_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (!session.authenticated || !session.expiresAt || Date.now() > session.expiresAt) {
      return null;
    }
    return session.passkeyHash || null;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    localStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    sessionStorage.removeItem("japan_shop_admin_authenticated_v1");
    localStorage.removeItem("japan_shop_admin_authenticated_v1");
  } catch {
    // ignore
  }
}

export function getLoginLockoutRemainingSeconds(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY) || localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!raw) return 0;
    const state: LoginAttemptState = JSON.parse(raw);
    if (!state.lockUntil) return 0;
    const remainingMs = state.lockUntil - Date.now();
    if (remainingMs <= 0) {
      resetLoginAttempts();
      return 0;
    }
    return Math.ceil(remainingMs / 1000);
  } catch {
    return 0;
  }
}

export function recordFailedLoginAttempt(): { locked: boolean; remainingAttempts: number; lockoutSeconds: number } {
  if (typeof window === "undefined") {
    return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS, lockoutSeconds: 0 };
  }
  try {
    const raw = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY) || localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    const prev: LoginAttemptState = raw ? JSON.parse(raw) : { count: 0, lockUntil: 0 };
    const nextCount = prev.count + 1;
    const isLocked = nextCount >= MAX_LOGIN_ATTEMPTS;
    const lockUntil = isLocked ? Date.now() + LOCKOUT_DURATION_MS : 0;

    const nextState: LoginAttemptState = { count: nextCount, lockUntil };
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(nextState));

    return {
      locked: isLocked,
      remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - nextCount),
      lockoutSeconds: isLocked ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0,
    };
  } catch {
    return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS, lockoutSeconds: 0 };
  }
}

export function resetLoginAttempts(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  } catch {
    // ignore
  }
}
