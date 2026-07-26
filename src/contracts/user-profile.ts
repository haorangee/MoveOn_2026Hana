import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';
import type { ChapterId } from '@/features/onboarding/domain/onboardingState';
import type { MvpPetId } from '@/features/customization/types/customization';

export type UserProfile = {
  nickname: string;
  age: number;
  birthDate: string;
  petSpecies: PetSpecies;
  petId?: MvpPetId | string | null;
  petName: string;
  characterId: CharacterId;
  chapter: ChapterId;
  magazineNotificationEnabled: boolean;
  onboardingCompleted: boolean;
  onboardingVersion: number;
  totalXp?: number;
  level?: number;
  grapes?: number;
};
