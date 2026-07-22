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
import { useAuth } from '@/features/auth/AuthProvider';
import { birthDateFromAge, resolveBirthDate } from '@/features/onboarding/birthDate';
import type { ChapterId } from '@/features/onboarding/domain/onboardingState';
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';
import {
  deleteUserProfile,
  ensureUserProfileDocument,
  loadUserProfile,
  saveUserProfile,
} from '@/features/onboarding/data/userProfileRepository';

const PROFILE_STORAGE_KEY = '@moveon/profile/v1';

function profileStorageKey(userId: string) {
  return `${PROFILE_STORAGE_KEY}/${userId}`;
}

export type MoveOnProfile = {
  name: string;
  age: number;
  birthDate: string;
  petSpecies: PetSpecies;
  petName: string;
  characterId: CharacterId;
  chapter: ChapterId;
  magazineNotificationEnabled: boolean;
};

export type ProfileSyncStatus = 'idle' | 'syncing' | 'synced' | 'offline';

const initialProfile: MoveOnProfile = {
  name: '',
  age: 20,
  birthDate: birthDateFromAge(20),
  petSpecies: 'dog',
  petName: '',
  characterId: 'daily',
  chapter: 'general',
  magazineNotificationEnabled: false,
};

const LEGACY_PET_NAME = '마루';

function normalizeCachedProfile(value: unknown): MoveOnProfile | null {
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
    petName: typeof profile.petName === 'string' && profile.petName.trim()
      ? profile.petName.trim()
      : LEGACY_PET_NAME,
    characterId: profile.characterId as CharacterId,
    chapter: profile.chapter === 'college'
      || profile.chapter === 'job-seeker'
      || profile.chapter === 'worker'
      ? profile.chapter
      : 'general',
    magazineNotificationEnabled: profile.magazineNotificationEnabled === true,
  };
}

function toUserProfile(profile: MoveOnProfile): UserProfile {
  return {
    nickname: profile.name,
    age: profile.age,
    birthDate: profile.birthDate,
    petSpecies: profile.petSpecies,
    petName: profile.petName,
    characterId: profile.characterId,
    chapter: profile.chapter,
    magazineNotificationEnabled: profile.magazineNotificationEnabled,
    onboardingCompleted: true,
  };
}

function toMoveOnProfile(profile: UserProfile): MoveOnProfile {
  return {
    name: profile.nickname,
    age: profile.age,
    birthDate: profile.birthDate,
    petSpecies: profile.petSpecies,
    petName: profile.petName,
    characterId: profile.characterId,
    chapter: profile.chapter,
    magazineNotificationEnabled: profile.magazineNotificationEnabled,
  };
}

type OnboardingContextValue = {
  profile: MoveOnProfile;
  userId: string | null;
  syncStatus: ProfileSyncStatus;
  isHydrated: boolean;
  isOnboarded: boolean;
  completeOnboarding: (profile: MoveOnProfile) => Promise<void>;
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

    if (!user || !isRegistered) {
      setProfile(initialProfile);
      setUserId(user?.uid ?? null);
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
      let cachedProfile: MoveOnProfile | null = null;

      try {
        const savedProfile = await AsyncStorage.getItem(profileStorageKey(currentUserId));
        if (savedProfile) {
          cachedProfile = normalizeCachedProfile(JSON.parse(savedProfile));
          if (active && cachedProfile) {
            setProfile(cachedProfile);
            setIsOnboarded(true);
            setIsHydrated(true);
          }
        }
      } catch {
        // 손상된 로컬 캐시는 무시하고 Firebase 프로필 조회를 계속합니다.
      }

      if (active) setSyncStatus('syncing');

      try {
        await ensureUserProfileDocument(currentUserId);
        const remoteProfile = await loadUserProfile(currentUserId);
        if (!active) return;

        if (remoteProfile?.onboardingCompleted) {
          const nextProfile = toMoveOnProfile(remoteProfile);
          setProfile(nextProfile);
          setIsOnboarded(true);
          await AsyncStorage.setItem(profileStorageKey(currentUserId), JSON.stringify(nextProfile));
        } else if (cachedProfile) {
          await saveUserProfile(currentUserId, toUserProfile(cachedProfile));
        } else {
          setProfile(initialProfile);
          setIsOnboarded(false);
        }

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
        if (!user || !isRegistered) {
          throw new Error('A registered Firebase user is required to save onboarding.');
        }

        setUserId(user.uid);
        await AsyncStorage.setItem(profileStorageKey(user.uid), JSON.stringify(nextProfile));
        await saveUserProfile(user.uid, toUserProfile(nextProfile));
        setSyncStatus('synced');
      } catch {
        setSyncStatus('offline');
      }
    },
    resetOnboarding: async () => {
      const currentUserId = userId;
      setProfile(initialProfile);
      setIsOnboarded(false);
      if (currentUserId) {
        await AsyncStorage.removeItem(profileStorageKey(currentUserId));
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
