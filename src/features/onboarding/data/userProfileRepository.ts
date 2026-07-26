import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import type { UserProfile } from '@/contracts/user-profile';
import { resolveBirthDate } from '@/features/onboarding/birthDate';

function profileDocument(userId: string) {
  return doc(firestore, 'users', userId);
}

export async function ensureUserProfileDocument(userId: string) {
  const reference = profileDocument(userId);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) return;

  await setDoc(reference, {
    onboardingCompleted: false,
    onboardingVersion: 0,
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
    birthDate: resolveBirthDate(data.birthDate, data.age),
    petSpecies: data.petSpecies as UserProfile['petSpecies'],
    petId: typeof data.petId === 'string' && data.petId.trim()
      ? data.petId.trim()
      : null,
    petName: typeof data.petName === 'string' && data.petName.trim()
      ? data.petName.trim()
      : '마루',
    characterId: data.characterId as UserProfile['characterId'],
    chapter: data.chapter === 'college'
      || data.chapter === 'job-seeker'
      || data.chapter === 'worker'
      ? data.chapter
      : 'general',
    magazineNotificationEnabled: data.magazineNotificationEnabled === true,
    onboardingCompleted: data.onboardingCompleted === true,
    onboardingVersion: typeof data.onboardingVersion === 'number'
      ? Math.max(0, Math.floor(data.onboardingVersion))
      : 0,
    totalXp: typeof data.totalXp === 'number' ? Math.max(0, Math.floor(data.totalXp)) : 0,
    level: typeof data.level === 'number' ? Math.max(1, Math.floor(data.level)) : 1,
    grapes: typeof data.grapes === 'number' ? Math.max(0, Math.floor(data.grapes)) : 0,
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
