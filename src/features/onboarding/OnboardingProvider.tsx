import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { UserProfile } from '@/contracts/user-profile';
import type { MvpPetId, MvpPetSpecies } from '@/features/customization/types/customization';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  recordFirebaseLogin,
  saveFirebaseUserProfile,
} from '@/features/auth/firebaseLoginRecords';
import { birthDateFromAge, resolveBirthDate } from '@/features/onboarding/birthDate';
import type { ChapterId } from '@/features/onboarding/domain/onboardingState';
import type { PetSpecies } from '@/features/onboarding/onboardingData';
import { onboardingRepository } from '@/features/onboarding/data/onboardingRepository';
import {
  deleteUserProfile,
  ensureUserProfileDocument,
  loadUserProfile,
  saveUserProfile,
} from '@/features/onboarding/data/userProfileRepository';

const PROFILE_STORAGE_KEY = '@moveon/profile/v1';
export const CURRENT_ONBOARDING_VERSION = 2;

function profileStorageKey(userId: string) {
  return `${PROFILE_STORAGE_KEY}/${userId}`;
}

export type MoveOnProfile = {
  name: string;
  age: number;
  birthDate: string;
  petSpecies: PetSpecies;
  petId?: MvpPetId | string | null;
  petName: string;
  characterId: string;
  chapter: ChapterId;
  magazineNotificationEnabled: boolean;
  totalXp: number;
  level: number;
  grapes: number;
};

export type ProfileSyncStatus = 'idle' | 'syncing' | 'synced' | 'offline';

const initialProfile: MoveOnProfile = {
  name: '',
  age: 20,
  birthDate: birthDateFromAge(20),
  petSpecies: 'dog',
  petId: null,
  petName: '',
  characterId: 'daily',
  chapter: 'general',
  magazineNotificationEnabled: false,
  totalXp: 0,
  level: 1,
  grapes: 0,
};

const LEGACY_PET_NAME = '마루';

type CachedProfilePayload = {
  profile: MoveOnProfile;
  onboardingCompleted: boolean;
  onboardingVersion: number;
};

function normalizeProfile(value: unknown): MoveOnProfile | null {
  if (!value || typeof value !== 'object') return null;

  const profile = value as Partial<MoveOnProfile>;
  if (
    typeof profile.name !== 'string'
    || typeof profile.age !== 'number'
    || typeof profile.petSpecies !== 'string'
    || typeof profile.characterId !== 'string'
  ) {
    return null;
  }

  return {
    name: profile.name,
    age: profile.age,
    birthDate: resolveBirthDate(profile.birthDate, profile.age),
    petSpecies: profile.petSpecies as PetSpecies,
    petId: typeof profile.petId === 'string' && profile.petId.trim()
      ? profile.petId.trim()
      : null,
    petName: typeof profile.petName === 'string' && profile.petName.trim()
      ? profile.petName.trim()
      : LEGACY_PET_NAME,
    characterId: profile.characterId,
    chapter: profile.chapter === 'college'
      || profile.chapter === 'job-seeker'
      || profile.chapter === 'worker'
      ? profile.chapter
      : 'general',
    magazineNotificationEnabled: profile.magazineNotificationEnabled === true,
    totalXp: typeof profile.totalXp === 'number' ? Math.max(0, Math.floor(profile.totalXp)) : 0,
    level: typeof profile.level === 'number' ? Math.max(1, Math.floor(profile.level)) : 1,
    grapes: typeof profile.grapes === 'number' ? Math.max(0, Math.floor(profile.grapes)) : 0,
  };
}

function normalizeCachedProfile(value: unknown): CachedProfilePayload | null {
  if (!value || typeof value !== 'object') return null;

  const payload = value as Partial<CachedProfilePayload>;
  const wrappedProfile = normalizeProfile(payload.profile);
  if (wrappedProfile) {
    return {
      profile: wrappedProfile,
      onboardingCompleted: payload.onboardingCompleted === true,
      onboardingVersion: typeof payload.onboardingVersion === 'number'
        ? Math.max(0, Math.floor(payload.onboardingVersion))
        : 0,
    };
  }

  const legacyProfile = normalizeProfile(value);
  return legacyProfile
    ? {
      profile: legacyProfile,
      onboardingCompleted: false,
      onboardingVersion: 0,
    }
    : null;
}

function cachedProfilePayload(
  profile: MoveOnProfile,
  onboardingCompleted: boolean,
): CachedProfilePayload {
  return {
    profile,
    onboardingCompleted,
    onboardingVersion: onboardingCompleted ? CURRENT_ONBOARDING_VERSION : 0,
  };
}

function toUserProfile(profile: MoveOnProfile): UserProfile {
  return {
    nickname: profile.name,
    age: profile.age,
    birthDate: profile.birthDate,
    petSpecies: profile.petSpecies,
    petId: profile.petId ?? null,
    petName: profile.petName,
    characterId: profile.characterId,
    chapter: profile.chapter,
    magazineNotificationEnabled: profile.magazineNotificationEnabled,
    onboardingCompleted: true,
    onboardingVersion: CURRENT_ONBOARDING_VERSION,
    totalXp: profile.totalXp,
    level: profile.level,
    grapes: profile.grapes,
  };
}

function toMoveOnProfile(profile: UserProfile): MoveOnProfile {
  return {
    name: profile.nickname,
    age: profile.age,
    birthDate: profile.birthDate,
    petSpecies: profile.petSpecies,
    petId: profile.petId ?? null,
    petName: profile.petName,
    characterId: profile.characterId,
    chapter: profile.chapter,
    magazineNotificationEnabled: profile.magazineNotificationEnabled,
    totalXp: profile.totalXp ?? 0,
    level: profile.level ?? 1,
    grapes: profile.grapes ?? 0,
  };
}

type OnboardingContextValue = {
  profile: MoveOnProfile;
  userId: string | null;
  syncStatus: ProfileSyncStatus;
  isHydrated: boolean;
  isOnboarded: boolean;
  completeOnboarding: (profile: MoveOnProfile) => Promise<void>;
  updateProfileCustomization: (patch: {
    characterId: string;
    petId: MvpPetId;
    petSpecies: MvpPetSpecies;
    petName: string;
  }) => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const { isReady: isAuthReady, isRegistered, user } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<ProfileSyncStatus>('idle');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    let active = true;

    if (!isAuthReady) {
      return () => {
        active = false;
      };
    }

    if (!user) {
      setProfile(initialProfile);
      setUserId(null);
      setSyncStatus('idle');
      setIsOnboarded(false);
      setIsHydrated(true);
      return () => {
        active = false;
      };
    }

    const currentUserId = user.uid;
    setUserId(currentUserId);
    setIsHydrated(false);

    async function hydrateProfile() {
      let cachedProfile: CachedProfilePayload | null = null;
      let loginProfile: MoveOnProfile | null = null;

      try {
        const savedProfile = await AsyncStorage.getItem(profileStorageKey(currentUserId));
        if (savedProfile) {
          cachedProfile = normalizeCachedProfile(JSON.parse(savedProfile));
          if (active && cachedProfile) {
            const cachedOnboardingCompleted = cachedProfile.onboardingCompleted
              && cachedProfile.onboardingVersion >= CURRENT_ONBOARDING_VERSION;
            setProfile(cachedProfile.profile);
            setIsOnboarded(cachedOnboardingCompleted);
            if (cachedOnboardingCompleted) setIsHydrated(true);
            loginProfile = cachedProfile.profile;
          }
        }
      } catch {
        // 손상된 로컬 캐시는 무시하고 Firebase 프로필 조회를 계속합니다.
      }

      if (!isRegistered) {
        if (active) {
          if (!cachedProfile) {
            setProfile(initialProfile);
            setIsOnboarded(false);
          }
          setSyncStatus('offline');
          setIsHydrated(true);
        }
        return;
      }

      if (active) setSyncStatus('syncing');

      try {
        await ensureUserProfileDocument(currentUserId);
        const remoteProfile = await loadUserProfile(currentUserId);
        if (!active) return;

        if (remoteProfile) {
          const nextProfile = toMoveOnProfile(remoteProfile);
          const onboardingCompleted = remoteProfile.onboardingCompleted
            && remoteProfile.onboardingVersion >= CURRENT_ONBOARDING_VERSION;
          setProfile(nextProfile);
          setIsOnboarded(onboardingCompleted);
          loginProfile = nextProfile;
          await AsyncStorage.setItem(
            profileStorageKey(currentUserId),
            JSON.stringify(cachedProfilePayload(nextProfile, onboardingCompleted)),
          );
        } else {
          setProfile(initialProfile);
          setIsOnboarded(false);
          await AsyncStorage.removeItem(profileStorageKey(currentUserId));
        }

        void recordFirebaseLogin(loginProfile).catch(() => undefined);
        if (active) setSyncStatus('synced');
      } catch {
        if (active) setSyncStatus('offline');
      } finally {
        if (active) setIsHydrated(true);
      }
    }

    void hydrateProfile();
    return () => {
      active = false;
    };
  }, [isAuthReady, isRegistered, user]);

  const value = useMemo<OnboardingContextValue>(() => ({
    profile,
    userId,
    syncStatus,
    isHydrated,
    isOnboarded,
    completeOnboarding: async (nextProfile) => {
      setProfile(nextProfile);
      setIsOnboarded(true);
      setSyncStatus('syncing');

      try {
        if (!user) {
          throw new Error('A Firebase user is required to save onboarding.');
        }

        setUserId(user.uid);
        await AsyncStorage.setItem(
          profileStorageKey(user.uid),
          JSON.stringify(cachedProfilePayload(nextProfile, true)),
        );

        if (!isRegistered) {
          setSyncStatus('offline');
          return;
        }

        await saveUserProfile(user.uid, toUserProfile(nextProfile));
        await saveFirebaseUserProfile(nextProfile);
        setSyncStatus('synced');
      } catch {
        setSyncStatus('offline');
      }
    },
    updateProfileCustomization: async (patch) => {
      if (!user) {
        throw new Error('A Firebase user is required to save profile customization.');
      }

      const nextProfile: MoveOnProfile = {
        ...profile,
        characterId: patch.characterId,
        petId: patch.petId,
        petSpecies: patch.petSpecies,
        petName: patch.petName,
      };

      setSyncStatus('syncing');
      setUserId(user.uid);

      try {
        await AsyncStorage.setItem(
          profileStorageKey(user.uid),
          JSON.stringify(cachedProfilePayload(nextProfile, isOnboarded)),
        );

        if (isRegistered) {
          await saveUserProfile(user.uid, toUserProfile(nextProfile));
        }

        setProfile(nextProfile);
        setSyncStatus(isRegistered ? 'synced' : 'offline');
      } catch (error) {
        setSyncStatus('offline');
        throw error;
      }
    },
    resetOnboarding: async () => {
      const currentUserId = userId;
      setProfile(initialProfile);
      setIsOnboarded(false);
      if (currentUserId) {
        await AsyncStorage.removeItem(profileStorageKey(currentUserId));
        await onboardingRepository.clear(currentUserId);
      }

      if (currentUserId) {
        try {
          setSyncStatus('syncing');
          await deleteUserProfile(currentUserId);
          setSyncStatus('synced');
        } catch {
          setSyncStatus('offline');
        }
      }
    },
  }), [isHydrated, isOnboarded, isRegistered, profile, syncStatus, user, userId]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used inside OnboardingProvider');
  }
  return context;
}
