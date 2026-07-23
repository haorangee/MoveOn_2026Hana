import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  normalizeOnboardingState,
  type OnboardingState,
} from '@/features/onboarding/domain/onboardingState';

const ONBOARDING_STORAGE_KEY = '@moveon/onboarding/tutorial/v2';

function storageKey(userId: string) {
  return `${ONBOARDING_STORAGE_KEY}/${userId}`;
}

export interface OnboardingRepository {
  load(userId: string): Promise<OnboardingState | null>;
  save(userId: string, state: OnboardingState): Promise<void>;
  clear(userId: string): Promise<void>;
}

export const onboardingRepository: OnboardingRepository = {
  async load(userId) {
    const value = await AsyncStorage.getItem(storageKey(userId));
    if (!value) return null;

    try {
      return normalizeOnboardingState(JSON.parse(value));
    } catch {
      return null;
    }
  },

  async save(userId, state) {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(state));
  },

  async clear(userId) {
    await AsyncStorage.removeItem(storageKey(userId));
  },
};
