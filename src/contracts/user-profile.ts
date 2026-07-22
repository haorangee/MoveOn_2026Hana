import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';
import type { ChapterId } from '@/features/onboarding/domain/onboardingState';

export type UserProfile = {
  nickname: string;
  age: number;
  birthDate: string;
  petSpecies: PetSpecies;
  petName: string;
  characterId: CharacterId;
  chapter: ChapterId;
  magazineNotificationEnabled: boolean;
  onboardingCompleted: boolean;
};
