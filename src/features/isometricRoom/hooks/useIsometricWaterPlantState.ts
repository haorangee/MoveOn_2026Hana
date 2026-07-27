import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  DAILY_WATER_CUP_COUNT,
  DAILY_WATER_GOAL_ML,
  loadWaterMissionState,
  WATER_PER_CUP_ML,
} from '@/features/home/waterMission';
import type { IsometricPlantStage } from '../types/isometricRoom';

type WaterPlantState = {
  recordedCupCount: number;
  goalCupCount: number;
  recordedAmountMl: number;
  goalAmountMl: number;
  stage: IsometricPlantStage;
  isCompleted: boolean;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

function toPlantStage(cupCount: number): IsometricPlantStage {
  return Math.min(Math.max(cupCount, 0), DAILY_WATER_CUP_COUNT) as IsometricPlantStage;
}

export function useIsometricWaterPlantState(): WaterPlantState {
  const [recordedCupCount, setRecordedCupCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      const waterState = await loadWaterMissionState();
      setRecordedCupCount(toPlantStage(waterState.cupCount));
      setError(null);
    } catch (nextError) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('Failed to load isometric water plant state.', nextError);
      }
      setRecordedCupCount(0);
      setError(nextError instanceof Error ? nextError : new Error('Failed to load water state.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void reload();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [reload]);

  return useMemo(() => {
    const stage = toPlantStage(recordedCupCount);
    return {
      recordedCupCount: stage,
      goalCupCount: DAILY_WATER_CUP_COUNT,
      recordedAmountMl: stage * WATER_PER_CUP_ML,
      goalAmountMl: DAILY_WATER_GOAL_ML,
      stage,
      isCompleted: stage >= DAILY_WATER_CUP_COUNT,
      isLoading,
      error,
      reload,
    };
  }, [error, isLoading, recordedCupCount, reload]);
}
