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
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';
import {
  deleteUserProfile,
  ensureUserProfileDocument,
  loadUserProfile,
  saveUserProfile,
} from '@/features/onboarding/data/userProfileRepository';
import { ensureAnonymousUser } from '@/shared/backend/authRepository';

const PROFILE_STORAGE_KEY = '@moveon/profile/v1';

export type MoveOnProfile = {
  name: string;
  age: number;
  petSpecies: PetSpecies;
  characterId: CharacterId;
};

export type ProfileSyncStatus = 'idle' | 'syncing' | 'synced' | 'offline';

const initialProfile: MoveOnProfile = {
  name: '',
  age: 20,
  petSpecies: 'dog',
  characterId: 'daily',
};

function toUserProfile(profile: MoveOnProfile): UserProfile {
  return {
    nickname: profile.name,
    age: profile.age,
    petSpecies: profile.petSpecies,
    characterId: profile.characterId,
    chapter: 'chapter-1',
    onboardingCompleted: true,
  };
}

function toMoveOnProfile(profile: UserProfile): MoveOnProfile {
  return {
    name: profile.nickname,
    age: profile.age,
    petSpecies: profile.petSpecies,
    characterId: profile.characterId,
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
  const [profile, setProfile] = useState(initialProfile);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<ProfileSyncStatus>('idle');
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    let active = true;

    async function hydrateProfile() {
      let cachedProfile: MoveOnProfile | null = null;

      try {
        const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (savedProfile) {
          cachedProfile = JSON.parse(savedProfile) as MoveOnProfile;
          if (active) {
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
        const user = await ensureAnonymousUser();
        if (!active) return;
        setUserId(user.uid);

        await ensureUserProfileDocument(user.uid);
        const remoteProfile = await loadUserProfile(user.uid);
        if (!active) return;

        if (remoteProfile?.onboardingCompleted) {
          const nextProfile = toMoveOnProfile(remoteProfile);
          setProfile(nextProfile);
          setIsOnboarded(true);
          await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
        } else if (cachedProfile) {
          await saveUserProfile(user.uid, toUserProfile(cachedProfile));
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
  }, []);

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
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));

      try {
        const user = await ensureAnonymousUser();
        setUserId(user.uid);
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
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);

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
  }), [isHydrated, isOnboarded, profile, syncStatus, userId]);

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
