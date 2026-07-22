import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  signInAnonymously,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from '@/config/firebaseAuth';

export async function ensureAnonymousUser(): Promise<User> {
  await firebaseAuth.authStateReady();

  if (firebaseAuth.currentUser) {
    return firebaseAuth.currentUser;
  }

  const credential = await signInAnonymously(firebaseAuth);
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email.trim(),
    password,
  );
  return credential.user;
}

export async function createEmailAccount(email: string, password: string): Promise<User> {
  await firebaseAuth.authStateReady();

  const normalizedEmail = email.trim();
  const currentUser = firebaseAuth.currentUser;

  if (currentUser?.isAnonymous) {
    const credential = EmailAuthProvider.credential(normalizedEmail, password);
    const linkedUser = await linkWithCredential(currentUser, credential);
    return linkedUser.user;
  }

  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    normalizedEmail,
    password,
  );
  return credential.user;
}

export async function signInWithFirebaseCustomToken(customToken: string): Promise<User> {
  const credential = await signInWithCustomToken(firebaseAuth, customToken);
  return credential.user;
}

export async function signOutCurrentUser() {
  await signOut(firebaseAuth);
}
