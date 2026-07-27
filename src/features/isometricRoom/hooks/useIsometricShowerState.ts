import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadShowerDayRecord } from '@/features/home/showerMission';
import type { IsometricShowerStage } from '../types/isometricRoom';

export function useIsometricShowerState() {
  const [stage, setStage] = useState<IsometricShowerStage>(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [todayShowerCount, setTodayShowerCount] = useState(0);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const record = await loadShowerDayRecord();
      const nextCompleted = record.totalSeconds > 0 || record.sessions.length > 0;
      const latestSession = record.sessions.at(-1);

      setStage(nextCompleted ? 1 : 0);
      setIsCompleted(nextCompleted);
      setTodayShowerCount(record.sessions.length);
      setCompletedAt(latestSession?.completedAt ?? null);
      setError(null);
    } catch (nextError) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('Failed to load isometric shower state.', nextError);
      }
      setStage(0);
      setIsCompleted(false);
      setTodayShowerCount(0);
      setCompletedAt(null);
      setError('샤워 상태를 불러오지 못했어요.');
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
    stage,
    isCompleted,
    isLoading,
    error,
    reload,
    completedAt,
    todayShowerCount,
  };
}
