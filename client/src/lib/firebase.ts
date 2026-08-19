import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';

// Firebase's web SDK config is not secret by design — it identifies the
// project to the browser; access is controlled by Firebase Auth + security
// rules and by restricting this key in Google Cloud Console (allowed APIs +
// HTTP referrers), not by hiding these values. Still pulled from env vars
// rather than hardcoded so it's not a literal match for secret scanners and
// is easy to rotate without a code change. See client/.env.example.
const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

const auth = getAuth(firebaseApp);

/** Opens the Google account picker and returns a Firebase ID token to send to our API. */
export async function signInWithGoogle(): Promise<string> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
}
