import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import type { UserProfile } from '@/contracts/user-profile';

function profileDocument(userId: string) {
  return doc(firestore, 'users', userId);
}

export async function ensureUserProfileDocument(userId: string) {
  const reference = profileDocument(userId);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) return;

  await setDoc(reference, {
    onboardingCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(profileDocument(userId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Partial<UserProfile>;
  if (
    typeof data.nickname !== 'string'
    || typeof data.age !== 'number'
    || typeof data.petSpecies !== 'string'
    || typeof data.characterId !== 'string'
  ) {
    return null;
  }

  return {
    nickname: data.nickname,
    age: data.age,
    petSpecies: data.petSpecies as UserProfile['petSpecies'],
    characterId: data.characterId as UserProfile['characterId'],
    chapter: typeof data.chapter === 'string' ? data.chapter : 'chapter-1',
    onboardingCompleted: data.onboardingCompleted === true,
  };
}

export async function saveUserProfile(userId: string, profile: UserProfile) {
  const reference = profileDocument(userId);
  const existingProfile = await getDoc(reference);

  await setDoc(reference, {
    ...profile,
    updatedAt: serverTimestamp(),
    ...(!existingProfile.exists() ? { createdAt: serverTimestamp() } : {}),
  }, { merge: true });
}

export async function deleteUserProfile(userId: string) {
  await deleteDoc(profileDocument(userId));
}
