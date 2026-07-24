import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const DAILY_CLEANING_GOAL = 3;
export const CLEANING_STORAGE_KEY = '@moveon/room-cleaning/v1';
const CLEANING_VERIFICATION_PENDING_KEY = '@moveon/room-cleaning/pending-verification/v1';

export type CleaningCount = 0 | 1 | 2 | 3;

export type CleaningMissionState = {
  dateKey: string;
  cleaningCount: CleaningCount;
  missionCompleted: boolean;
  rewarded: boolean;
  lastCleanedAt: number | null;
};

type StoredCleaningMissionState = Partial<CleaningMissionState>;

export function getLocalDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clampCleaningCount(value: unknown): CleaningCount {
  const count = Number(value);
  if (!Number.isFinite(count)) return 0;
  return Math.min(DAILY_CLEANING_GOAL, Math.max(0, Math.floor(count))) as CleaningCount;
}

function isTodayTimestamp(value: number, dateKey: string) {
  if (!Number.isFinite(value)) return false;
  return getLocalDateKey(new Date(value)) === dateKey;
}

export function createEmptyCleaningMissionState(
  dateKey = getLocalDateKey(),
): CleaningMissionState {
  return {
    dateKey,
    cleaningCount: 0,
    missionCompleted: false,
    rewarded: false,
    lastCleanedAt: null,
  };
}

export function normalizeCleaningMissionState(
  value: string | null,
  dateKey = getLocalDateKey(),
): CleaningMissionState {
  if (!value) return createEmptyCleaningMissionState(dateKey);

  const legacyTimestamp = Number(value);
  if (Number.isFinite(legacyTimestamp)) {
    if (!isTodayTimestamp(legacyTimestamp, dateKey)) {
      return createEmptyCleaningMissionState(dateKey);
    }

    return {
      dateKey,
      cleaningCount: 1,
      missionCompleted: false,
      rewarded: false,
      lastCleanedAt: legacyTimestamp,
    };
  }

  try {
    const parsed = JSON.parse(value) as StoredCleaningMissionState;
    if (parsed.dateKey !== dateKey) return createEmptyCleaningMissionState(dateKey);

    const cleaningCount = clampCleaningCount(parsed.cleaningCount);
    const missionCompleted = parsed.missionCompleted === true
      || cleaningCount >= DAILY_CLEANING_GOAL;

    return {
      dateKey,
      cleaningCount,
      missionCompleted,
      rewarded: parsed.rewarded === true && missionCompleted,
      lastCleanedAt: Number.isFinite(Number(parsed.lastCleanedAt))
        ? Number(parsed.lastCleanedAt)
        : null,
    };
  } catch {
    return createEmptyCleaningMissionState(dateKey);
  }
}

async function persistCleaningMissionState(state: CleaningMissionState) {
  await AsyncStorage.setItem(CLEANING_STORAGE_KEY, JSON.stringify(state));
}

export async function loadCleaningMissionState(dateKey = getLocalDateKey()) {
  const savedValue = await AsyncStorage.getItem(CLEANING_STORAGE_KEY);
  return normalizeCleaningMissionState(savedValue, dateKey);
}

export async function recordCleaning(currentState: CleaningMissionState) {
  if (currentState.cleaningCount >= DAILY_CLEANING_GOAL) return currentState;

  const nextCleaningCount = Math.min(
    DAILY_CLEANING_GOAL,
    currentState.cleaningCount + 1,
  ) as CleaningCount;
  const missionCompleted = nextCleaningCount >= DAILY_CLEANING_GOAL;
  const nextState: CleaningMissionState = {
    ...currentState,
    cleaningCount: nextCleaningCount,
    missionCompleted,
    rewarded: missionCompleted ? true : currentState.rewarded,
    lastCleanedAt: Date.now(),
  };

  await persistCleaningMissionState(nextState);
  return nextState;
}

export async function markCleaningVerificationPending() {
  await AsyncStorage.setItem(CLEANING_VERIFICATION_PENDING_KEY, String(Date.now()));
}

export async function consumeCleaningVerificationPending() {
  const pendingValue = await AsyncStorage.getItem(CLEANING_VERIFICATION_PENDING_KEY);
  if (!pendingValue) return false;

  await AsyncStorage.removeItem(CLEANING_VERIFICATION_PENDING_KEY);
  return true;
}

type UseCleaningMissionOptions = {
  onChange?: (state: CleaningMissionState) => void;
};

export function useCleaningMission(options: UseCleaningMissionOptions = {}) {
  const onChange = options.onChange;
  const todayKey = useMemo(() => getLocalDateKey(), []);
  const [state, setState] = useState<CleaningMissionState>(() => (
    createEmptyCleaningMissionState(todayKey)
  ));
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordingLock = useRef(false);

  const updateState = useCallback(
    (nextState: CleaningMissionState) => {
      setState(nextState);
      onChange?.(nextState);
    },
    [onChange],
  );

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const nextState = await loadCleaningMissionState(todayKey);
        if (active) updateState(nextState);
      } catch {
        if (active) updateState(createEmptyCleaningMissionState(todayKey));
      } finally {
        if (active) setIsHydrated(true);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [todayKey, updateState]);

  const record = useCallback(async () => {
    if (!isHydrated || recordingLock.current) return state;

    recordingLock.current = true;
    setIsRecording(true);
    try {
      const nextState = await recordCleaning(state);
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
    record,
  };
}
