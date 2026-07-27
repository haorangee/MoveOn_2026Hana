import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  DAILY_CLEANING_GOAL,
  loadCleaningMissionState,
} from '@/features/home/cleaningMission';
import type { IsometricCleaningStage } from '../types/isometricRoom';

function toCleaningStage(cleaningCount: number): IsometricCleaningStage {
  return Math.min(
    Math.max(Math.floor(cleaningCount), 0),
    DAILY_CLEANING_GOAL,
  ) as IsometricCleaningStage;
}

export function useIsometricCleaningState() {
  const [todayCleaningCount, setTodayCleaningCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stage = useMemo(
    () => toCleaningStage(todayCleaningCount),
    [todayCleaningCount],
  );

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await loadCleaningMissionState();
      setTodayCleaningCount(state.cleaningCount);
      setIsCompleted(state.missionCompleted);
      setError(null);
    } catch (nextError) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('Failed to load isometric cleaning state.', nextError);
      }
      setTodayCleaningCount(0);
      setIsCompleted(false);
      setError('청소 상태를 불러오지 못했어요.');
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
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void reload();
      }
    });

    return () => subscription.remove();
  }, [reload]);

  return {
    todayCleaningCount,
    stage,
    isCompleted,
    isLoading,
    error,
    reload,
  };
}
