import { Platform } from 'react-native';
import { signInAnonymously, type User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { MoveOnProfile } from '@/features/onboarding/OnboardingProvider';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/shared/firebase';

let loginRecordPromise: Promise<User | null> | null = null;

async function getOrCreateAnonymousUser() {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export function recordFirebaseLogin(profile?: MoveOnProfile | null) {
  if (loginRecordPromise) return loginRecordPromise;

  loginRecordPromise = (async () => {
    if (!isFirebaseConfigured()) return null;

    const db = getFirebaseDb();
    const user = await getOrCreateAnonymousUser();
    if (!db || !user) return null;

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      authProvider: user.isAnonymous ? 'anonymous' : 'firebase',
      displayName: profile?.name ?? null,
      profile: profile ?? null,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    await addDoc(collection(userRef, 'loginRecords'), {
      platform: Platform.OS,
      app: 'MoveOn',
      signedInAnonymously: user.isAnonymous,
      createdAt: serverTimestamp(),
    });

    return user;
  })();

  return loginRecordPromise;
}

export async function saveFirebaseUserProfile(profile: MoveOnProfile) {
  if (!isFirebaseConfigured()) return null;

  const db = getFirebaseDb();
  const user = await getOrCreateAnonymousUser();
  if (!db || !user) return null;

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    authProvider: user.isAnonymous ? 'anonymous' : 'firebase',
    displayName: profile.name,
    profile,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return user;
}
