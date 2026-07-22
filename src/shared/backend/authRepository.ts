import { signInAnonymously, type User } from 'firebase/auth';
import { firebaseAuth } from '@/config/firebaseAuth';

export async function ensureAnonymousUser(): Promise<User> {
  await firebaseAuth.authStateReady();

  if (firebaseAuth.currentUser) {
    return firebaseAuth.currentUser;
  }

  const credential = await signInAnonymously(firebaseAuth);
  return credential.user;
}
