import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const DAILY_WATER_GOAL_ML = 2000;
export const DAILY_WATER_CUP_COUNT = 5;
export const WATER_PER_CUP_ML = DAILY_WATER_GOAL_ML / DAILY_WATER_CUP_COUNT;

const WATER_STORAGE_KEY = '@moveon/water-mission/v1';

export type WaterMissionState = {
  dateKey: string;
  cupCount: number;
  consumedMl: number;
  missionCompleted: boolean;
  flowerBloomed: boolean;
  rewarded: boolean;
  lastRecordedAt: number | null;
};

type StoredWaterMissionState = Partial<Omit<WaterMissionState, 'consumedMl'>>;

export function getLocalDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clampCupCount(value: unknown) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 0;
  return Math.min(DAILY_WATER_CUP_COUNT, Math.max(0, Math.floor(count)));
}

export function createEmptyWaterMissionState(dateKey = getLocalDateKey()): WaterMissionState {
  return {
    dateKey,
    cupCount: 0,
    consumedMl: 0,
    missionCompleted: false,
    flowerBloomed: false,
    rewarded: false,
    lastRecordedAt: null,
  };
}

export function normalizeWaterMissionState(
  value: string | null,
  dateKey = getLocalDateKey(),
): WaterMissionState {
  if (!value) return createEmptyWaterMissionState(dateKey);

  try {
    const parsed = JSON.parse(value) as StoredWaterMissionState;
    if (parsed.dateKey !== dateKey) return createEmptyWaterMissionState(dateKey);

    const cupCount = clampCupCount(parsed.cupCount);
    const missionCompleted = parsed.missionCompleted === true || cupCount >= DAILY_WATER_CUP_COUNT;

    return {
      dateKey,
      cupCount,
      consumedMl: cupCount * WATER_PER_CUP_ML,
      missionCompleted,
      flowerBloomed: parsed.flowerBloomed === true && missionCompleted,
      rewarded: parsed.rewarded === true && missionCompleted,
      lastRecordedAt: Number.isFinite(Number(parsed.lastRecordedAt))
        ? Number(parsed.lastRecordedAt)
        : null,
    };
  } catch {
    return createEmptyWaterMissionState(dateKey);
  }
}

async function persistWaterMissionState(state: WaterMissionState) {
  await AsyncStorage.setItem(
    WATER_STORAGE_KEY,
    JSON.stringify({
      dateKey: state.dateKey,
      cupCount: state.cupCount,
      missionCompleted: state.missionCompleted,
      flowerBloomed: state.flowerBloomed,
      rewarded: state.rewarded,
      lastRecordedAt: state.lastRecordedAt,
    }),
  );
}

export async function loadWaterMissionState(dateKey = getLocalDateKey()) {
  const savedValue = await AsyncStorage.getItem(WATER_STORAGE_KEY);
  return normalizeWaterMissionState(savedValue, dateKey);
}

export async function recordWaterIntake(currentState: WaterMissionState) {
  if (currentState.missionCompleted) return currentState;

  const nextCupCount = Math.min(DAILY_WATER_CUP_COUNT, currentState.cupCount + 1);
  const nextState: WaterMissionState = {
    ...currentState,
    cupCount: nextCupCount,
    consumedMl: nextCupCount * WATER_PER_CUP_ML,
    missionCompleted: nextCupCount >= DAILY_WATER_CUP_COUNT,
    lastRecordedAt: Date.now(),
  };

  await persistWaterMissionState(nextState);
  return nextState;
}

export async function markWaterFlowerBloomed(currentState: WaterMissionState) {
  const nextState: WaterMissionState = {
    ...currentState,
    flowerBloomed: currentState.missionCompleted,
    rewarded: currentState.missionCompleted ? true : currentState.rewarded,
  };

  await persistWaterMissionState(nextState);
  return nextState;
}

type UseWaterMissionOptions = {
  onChange?: (state: WaterMissionState) => void;
};

export function useWaterMission(options: UseWaterMissionOptions = {}) {
  const onChange = options.onChange;
  const todayKey = useMemo(() => getLocalDateKey(), []);
  const [state, setState] = useState<WaterMissionState>(() => (
    createEmptyWaterMissionState(todayKey)
  ));
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordingLock = useRef(false);

  const updateState = useCallback(
    (nextState: WaterMissionState) => {
      setState(nextState);
      onChange?.(nextState);
    },
    [onChange],
  );

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const nextState = await loadWaterMissionState(todayKey);
        if (active) updateState(nextState);
      } catch {
        if (active) updateState(createEmptyWaterMissionState(todayKey));
      } finally {
        if (active) setIsHydrated(true);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [todayKey, updateState]);

  const recordCup = useCallback(async () => {
    if (!isHydrated || recordingLock.current || state.missionCompleted) return state;

    recordingLock.current = true;
    setIsRecording(true);
    try {
      const nextState = await recordWaterIntake(state);
      updateState(nextState);
      return nextState;
    } finally {
      recordingLock.current = false;
      setIsRecording(false);
    }
  }, [isHydrated, state, updateState]);

  const markFlowerBloomed = useCallback(async () => {
    if (!isHydrated || recordingLock.current || !state.missionCompleted) return state;

    recordingLock.current = true;
    setIsRecording(true);
    try {
      const nextState = await markWaterFlowerBloomed(state);
      updateState(nextState);
      return nextState;
    } finally {
      recordingLock.current = false;
      setIsRecording(false);
    }
  }, [isHydrated, state, updateState]);

  return {
    state,
    isHydrated,
    isRecording,
    recordCup,
    markFlowerBloomed,
  };
}
