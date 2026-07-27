import { useMemo } from 'react';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import {
  DEFAULT_MVP_CHARACTER_ID,
  isMvpCharacterId,
} from '@/features/customization/catalogs/characterCatalog';
import {
  getDefaultMvpPetIdBySpecies,
  isMvpPetId,
} from '@/features/customization/catalogs/petCatalog';

export function useIsometricRoomProfile() {
  const { isHydrated, profile } = useOnboarding();

  return useMemo(() => {
    const characterId = isMvpCharacterId(profile.characterId)
      ? profile.characterId
      : DEFAULT_MVP_CHARACTER_ID;
    const petId = isMvpPetId(profile.petId)
      ? profile.petId
      : getDefaultMvpPetIdBySpecies(profile.petSpecies);

    return {
      characterId,
      petId,
      petSpecies: profile.petSpecies,
      petName: profile.petName,
      isLoading: !isHydrated,
      error: null,
    };
  }, [isHydrated, profile.characterId, profile.petId, profile.petName, profile.petSpecies]);
}
