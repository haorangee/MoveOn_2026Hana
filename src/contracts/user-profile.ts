import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';

export type UserProfile = {
  nickname: string;
  age: number;
  petSpecies: PetSpecies;
  characterId: CharacterId;
  chapter: string;
  onboardingCompleted: boolean;
};
