import { auth } from "../firebase/config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from "firebase/auth";

/**
 * Registra usuário com email e senha e atualiza displayName (opcional)
 */
export async function registerWithEmail(email: string, password: string, displayName?: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    try {
      await updateProfile(userCredential.user, { displayName });
    } catch (e) {
      console.warn("Falha ao atualizar profile:", e);
    }
  }
  return userCredential.user;
}

export async function loginWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logout() {
  return signOut(auth);
}

export function onAuthChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}