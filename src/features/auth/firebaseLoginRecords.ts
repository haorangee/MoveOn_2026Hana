import { Platform } from 'react-native';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { firebaseAuth } from '@/config/firebaseAuth';
import { firestore } from '@/config/firebase';
import type { MoveOnProfile } from '@/features/onboarding/OnboardingProvider';

const loginRecordPromises = new Map<string, Promise<void>>();

export function recordFirebaseLogin(profile?: MoveOnProfile | null) {
  const user = firebaseAuth.currentUser;
  if (!user || user.isAnonymous) return Promise.resolve();

  const existingPromise = loginRecordPromises.get(user.uid);
  if (existingPromise) return existingPromise;

  const recordPromise = (async () => {
    const userRef = doc(firestore, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      authProvider: user.providerData[0]?.providerId ?? 'firebase',
      displayName: profile?.name ?? null,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    await addDoc(collection(userRef, 'loginRecords'), {
      platform: Platform.OS,
      app: 'MoveOn',
      createdAt: serverTimestamp(),
    });
  })().catch((error) => {
    loginRecordPromises.delete(user.uid);
    throw error;
  });

  loginRecordPromises.set(user.uid, recordPromise);
  return recordPromise;
}

export async function saveFirebaseUserProfile(profile: MoveOnProfile) {
  const user = firebaseAuth.currentUser;
  if (!user || user.isAnonymous) return;

  await setDoc(doc(firestore, 'users', user.uid), {
    uid: user.uid,
    authProvider: user.providerData[0]?.providerId ?? 'firebase',
    displayName: profile.name,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
