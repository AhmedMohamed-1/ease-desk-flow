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

/** Opens the Firebase Google popup and returns the signed-in Firebase user. */
export async function signInWithFirebaseGoogle() {
  const app = await getFirebaseApp();
  const { getAuth, GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const auth = getAuth(app);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user;
}

/** Initialises Firebase Analytics when the browser supports it. */
export async function initFirebaseAnalytics() {
  if (typeof window === "undefined") return null;
  const app = await getFirebaseApp();
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (!(await isSupported())) return null;
  return getAnalytics(app);
}
