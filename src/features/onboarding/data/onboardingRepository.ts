import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  normalizeOnboardingState,
  type OnboardingState,
} from '@/features/onboarding/domain/onboardingState';

const ONBOARDING_STORAGE_KEY = '@moveon/onboarding/tutorial/v1';

export interface OnboardingRepository {
  load(): Promise<OnboardingState | null>;
  save(state: OnboardingState): Promise<void>;
}

export const onboardingRepository: OnboardingRepository = {
  async load() {
    const value = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!value) return null;

    try {
      return normalizeOnboardingState(JSON.parse(value));
    } catch {
      return null;
    }
  },

  async save(state) {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  },
};
