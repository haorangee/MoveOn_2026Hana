import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  recordFirebaseLogin,
  saveFirebaseUserProfile,
} from '@/features/auth/firebaseLoginRecords';
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';

const PROFILE_STORAGE_KEY = '@moveon/profile/v1';

export type MoveOnProfile = {
  name: string;
  age: number;
  petSpecies: PetSpecies;
  characterId: CharacterId;
};

const initialProfile: MoveOnProfile = {
  name: '',
  age: 20,
  petSpecies: 'dog',
  characterId: 'daily',
};

type OnboardingContextValue = {
  profile: MoveOnProfile;
  isHydrated: boolean;
  isOnboarded: boolean;
  completeOnboarding: (profile: MoveOnProfile) => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState(initialProfile);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    async function hydrateProfile() {
      try {
        const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile) as MoveOnProfile;
          setProfile(parsedProfile);
          setIsOnboarded(true);
          void recordFirebaseLogin(parsedProfile);
        } else {
          void recordFirebaseLogin(null);
        }
      } catch {
        void recordFirebaseLogin(null);
      } finally {
        setIsHydrated(true);
      }
    }

    void hydrateProfile();
  }, []);

  const value = useMemo<OnboardingContextValue>(() => ({
    profile,
    isHydrated,
    isOnboarded,
    completeOnboarding: async (nextProfile) => {
      setProfile(nextProfile);
      setIsOnboarded(true);
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      void saveFirebaseUserProfile(nextProfile);
    },
    resetOnboarding: async () => {
      setProfile(initialProfile);
      setIsOnboarded(false);
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
    },
  }), [isHydrated, isOnboarded, profile]);

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
