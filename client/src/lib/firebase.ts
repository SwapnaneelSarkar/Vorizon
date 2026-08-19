import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';

// Firebase's web SDK config is not secret — it identifies the project to the
// browser, access is controlled by Firebase Auth + security rules, not by
// hiding these values. Pulled from the "vorizon" web app in project
// cosmectsecretbase (`firebase apps:sdkconfig WEB`).
const firebaseApp = initializeApp({
  apiKey: 'AIzaSyBqRe-EpEZRlPbqQwvsXqemu7C-LcKOZxo',
  authDomain: 'cosmectsecretbase.firebaseapp.com',
  projectId: 'cosmectsecretbase',
  storageBucket: 'cosmectsecretbase.appspot.com',
  messagingSenderId: '673902025659',
  appId: '1:673902025659:web:4131d8e98a665c5755829e',
});

const auth = getAuth(firebaseApp);

/** Opens the Google account picker and returns a Firebase ID token to send to our API. */
export async function signInWithGoogle(): Promise<string> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
}
