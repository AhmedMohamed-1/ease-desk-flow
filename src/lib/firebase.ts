import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirebaseConfig } from "./firebase-config.functions";

let appPromise: Promise<FirebaseApp> | null = null;

/** Lazily initialises Firebase in the browser only. */
export function getFirebaseApp(): Promise<FirebaseApp> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Firebase is browser-only"));
  }
  if (!appPromise) {
    appPromise = (async () => {
      const existing = getApps()[0];
      if (existing) return existing;
      const config = await getFirebaseConfig();
      return initializeApp(config);
    })();
  }
  return appPromise;
}

// Note: authentication is handled by Supabase Auth (Google + email/password),
// so Firebase is used for analytics only. Adding Firebase Auth here would create
// a second identity that has no tickets, roles or RLS access.


/** Initialises Firebase Analytics when the browser supports it. */
export async function initFirebaseAnalytics() {
  if (typeof window === "undefined") return null;
  const app = await getFirebaseApp();
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (!(await isSupported())) return null;
  return getAnalytics(app);
}
