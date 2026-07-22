import { useCallback, useEffect, useMemo, useState } from 'react';
import { onboardingRepository } from '@/features/onboarding/data/onboardingRepository';
import {
  defaultOnboardingState,
  normalizeOnboardingState,
  type OnboardingState,
} from '@/features/onboarding/domain/onboardingState';

type TutorialSeed = Partial<OnboardingState>;

export function useOnboardingTutorial(seed: TutorialSeed, replay = false) {
  const seedState = useMemo(
    () => normalizeOnboardingState({ ...defaultOnboardingState, ...seed }),
    // The profile seed is only used during the first hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [state, setState] = useState(seedState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const saved = await onboardingRepository.load();
      if (!active) return;

      if (saved) {
        setState(replay
          ? { ...saved, currentStep: 0, profileSetupStep: 0, phase: 'guide' }
          : saved);
      }
      setIsHydrated(true);
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [replay]);

  const update = useCallback((patch: Partial<OnboardingState>) => {
    setState((current) => {
      const next = normalizeOnboardingState({ ...current, ...patch });
      void onboardingRepository.save(next);
      return next;
    });
  }, []);

  const complete = useCallback(async () => {
    const next = normalizeOnboardingState({
      ...state,
      currentStep: 5,
      phase: 'complete',
      tutorialCompleted: true,
    });
    setState(next);
    await onboardingRepository.save(next);
    return next;
  }, [state]);

  return { state, isHydrated, update, complete };
}
