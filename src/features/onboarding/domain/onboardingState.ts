import {
  isMvpCharacterId,
} from '@/features/customization/catalogs/characterCatalog';
import {
  getDefaultMvpPetIdBySpecies,
  isMvpPetId,
  isMvpPetSpecies,
} from '@/features/customization/catalogs/petCatalog';
import type { MvpPetId } from '@/features/customization/types/customization';
import type { CharacterId, PetSpecies } from '@/features/onboarding/onboardingData';

export const ONBOARDING_STAGE_COUNT = 6;

export type ChapterId = 'college' | 'job-seeker' | 'worker' | 'general';
export type OnboardingPhase = 'guide' | 'first-action' | 'complete';

export type OnboardingState = {
  currentStep: number;
  profileSetupStep: number;
  phase: OnboardingPhase;
  nickname: string;
  birthDate: string;
  selectedPetSpecies: PetSpecies;
  selectedPetId: MvpPetId | null;
  petName: string;
  selectedCharacterId: string;
  selectedChapter: ChapterId;
  magazineNotificationEnabled: boolean | null;
  tutorialCompleted: boolean;
  firstBookCreated: boolean;
};

export const chapterOptions: Array<{
  id: ChapterId;
  label: string;
  description: string;
}> = [
  { id: 'college', label: '대학생', description: '배움과 경험을 쌓는 시간' },
  { id: 'job-seeker', label: '취업준비생', description: '나만의 다음 장을 준비하는 시간' },
  { id: 'worker', label: '직장인', description: '일과 삶의 리듬을 만드는 시간' },
  { id: 'general', label: '일반', description: '지금의 나에게 집중하는 시간' },
];

export const defaultOnboardingState: OnboardingState = {
  currentStep: 0,
  profileSetupStep: 0,
  phase: 'guide',
  nickname: '',
  birthDate: '',
  selectedPetSpecies: 'dog',
  selectedPetId: 'dog-bichon',
  petName: '',
  selectedCharacterId: 'daily',
  selectedChapter: 'general',
  magazineNotificationEnabled: null,
  tutorialCompleted: false,
  firstBookCreated: false,
};

const characterIds: CharacterId[] = ['daily', 'cozy', 'casual', 'neat', 'ropan'];
const petSpecies: PetSpecies[] = ['dog', 'cat', 'rabbit', 'hamster', 'squirrel'];
const chapterIds: ChapterId[] = ['college', 'job-seeker', 'worker', 'general'];

export function normalizeOnboardingState(value: unknown): OnboardingState {
  if (!value || typeof value !== 'object') return defaultOnboardingState;

  const state = value as Partial<OnboardingState>;
  const currentStep = typeof state.currentStep === 'number'
    ? Math.min(ONBOARDING_STAGE_COUNT - 1, Math.max(0, Math.floor(state.currentStep)))
    : 0;
  const profileSetupStep = typeof state.profileSetupStep === 'number'
    ? Math.min(6, Math.max(0, Math.floor(state.profileSetupStep)))
    : 0;

  const selectedPetSpecies = petSpecies.includes(state.selectedPetSpecies as PetSpecies)
    ? state.selectedPetSpecies as PetSpecies
    : 'dog';
  const selectedPetId = isMvpPetId(state.selectedPetId)
    ? state.selectedPetId
    : isMvpPetSpecies(selectedPetSpecies)
      ? getDefaultMvpPetIdBySpecies(selectedPetSpecies)
      : null;
  const incomingCharacterId = typeof state.selectedCharacterId === 'string'
    ? state.selectedCharacterId
    : '';
  const selectedCharacterId = characterIds.includes(incomingCharacterId as CharacterId)
    || isMvpCharacterId(incomingCharacterId)
    ? incomingCharacterId
    : 'daily';

  return {
    ...defaultOnboardingState,
    currentStep,
    profileSetupStep,
    phase: state.phase === 'first-action' || state.phase === 'complete' ? state.phase : 'guide',
    nickname: typeof state.nickname === 'string' ? state.nickname.slice(0, 10) : '',
    birthDate: typeof state.birthDate === 'string' ? state.birthDate : '',
    selectedPetSpecies,
    selectedPetId,
    petName: typeof state.petName === 'string' && state.petName.trim()
      ? state.petName.slice(0, 10)
      : '',
    selectedCharacterId,
    selectedChapter: chapterIds.includes(state.selectedChapter as ChapterId)
      ? state.selectedChapter as ChapterId
      : 'general',
    magazineNotificationEnabled:
      typeof state.magazineNotificationEnabled === 'boolean'
        ? state.magazineNotificationEnabled
        : null,
    tutorialCompleted: state.tutorialCompleted === true,
    firstBookCreated: state.firstBookCreated === true,
  };
}
