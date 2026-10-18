"use client";

/**
 * Generates and preserves a persistent unique Device ID across visits.
 * Stored in both localStorage and long-lived browser cookies.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const STORAGE_KEY = "cz_device_id";
  const LEGACY_KEY = "pc_device_id";

  try {
    // 1. Check localStorage
    const localId = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (localId && localId.trim()) {
      // Ensure current key and cookie are set
      localStorage.setItem(STORAGE_KEY, localId.trim());
      setCookie(STORAGE_KEY, localId.trim(), 730);
      return localId.trim();
    }

    // 2. Check Cookie
    const cookieId = getCookie(STORAGE_KEY) || getCookie(LEGACY_KEY);
    if (cookieId && cookieId.trim()) {
      localStorage.setItem(STORAGE_KEY, cookieId.trim());
      setCookie(STORAGE_KEY, cookieId.trim(), 730);
      return cookieId.trim();
    }

    // 3. Generate new unique Device ID
    const randomPart1 = Math.random().toString(36).substring(2, 10);
    const timePart = Date.now().toString(36);
    const randomPart2 = Math.random().toString(36).substring(2, 8);
    const newId = `cz-dev-${randomPart1}-${timePart}-${randomPart2}`;

    localStorage.setItem(STORAGE_KEY, newId);
    setCookie(STORAGE_KEY, newId, 730);
    return newId;
  } catch {
    // Return fallback identifier if storage is restricted
    return `cz-fallback-${Date.now().toString(36)}`;
  }
}

function setCookie(name: string, value: string, days: number) {
  try {
    if (typeof document === "undefined") return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
  } catch {
    // Ignore cookie write errors
  }
}

function getCookie(name: string): string | null {
  try {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
    return match ? decodeURIComponent(match[3]) : null;
  } catch {
    return null;
  }
}
