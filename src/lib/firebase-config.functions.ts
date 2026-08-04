import { createServerFn } from "@tanstack/react-start";

/**
 * The Firebase web config is publishable, but the API key is stored as a
 * project secret, so it is handed to the browser from the server at runtime.
 */
export const getFirebaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env["GOOGLE_API_KEY"];
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not configured");

  return {
    apiKey,
    authDomain: "helpdesklite.firebaseapp.com",
    projectId: "helpdesklite",
    storageBucket: "helpdesklite.firebasestorage.app",
    messagingSenderId: "596416121618",
    appId: "1:596416121618:web:5300f72a1846ccaf3281cb",
    measurementId: "G-56EL8KHQR2",
  };
});
