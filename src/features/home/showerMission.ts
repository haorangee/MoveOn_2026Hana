import AsyncStorage from '@react-native-async-storage/async-storage';

export const SHOWER_DURATION_OPTIONS = [10, 20, 30] as const;

export type ShowerDurationMinutes = (typeof SHOWER_DURATION_OPTIONS)[number];

export type ShowerSessionRecord = {
  id: string;
  selectedMinutes: ShowerDurationMinutes;
  actualSeconds: number;
  completedAt: string;
};

export type ShowerDayRecord = {
  date: string;
  totalSeconds: number;
  sessions: ShowerSessionRecord[];
  rewardProcessed: boolean;
};

export type ActiveShowerTimer = {
  date: string;
  selectedMinutes: ShowerDurationMinutes;
  startedAt: number;
};

const SHOWER_RECORD_KEY = '@moveon/shower-record/v1';
const ACTIVE_SHOWER_TIMER_KEY = '@moveon/shower-active-timer/v1';

export function getLocalDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createEmptyShowerDayRecord(date = getLocalDateKey()): ShowerDayRecord {
  return {
    date,
    totalSeconds: 0,
    sessions: [],
    rewardProcessed: false,
  };
}

function normalizeSelectedMinutes(value: unknown): ShowerDurationMinutes {
  const minutes = Number(value);
  return SHOWER_DURATION_OPTIONS.includes(minutes as ShowerDurationMinutes)
    ? minutes as ShowerDurationMinutes
    : 10;
}

function normalizeRecord(value: string | null, date = getLocalDateKey()): ShowerDayRecord {
  if (!value) return createEmptyShowerDayRecord(date);

  try {
    const parsed = JSON.parse(value) as Partial<ShowerDayRecord>;
    if (parsed.date !== date) return createEmptyShowerDayRecord(date);

    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions
        .map((session, index) => ({
          id: typeof session.id === 'string' ? session.id : `legacy-${index}`,
          selectedMinutes: normalizeSelectedMinutes(session.selectedMinutes),
          actualSeconds: Math.max(0, Math.floor(Number(session.actualSeconds) || 0)),
          completedAt: typeof session.completedAt === 'string' ? session.completedAt : new Date().toISOString(),
        }))
        .filter((session) => session.actualSeconds > 0)
      : [];

    const totalSeconds = sessions.reduce((sum, session) => sum + session.actualSeconds, 0);
    return {
      date,
      totalSeconds,
      sessions,
      rewardProcessed: parsed.rewardProcessed === true,
    };
  } catch {
    return createEmptyShowerDayRecord(date);
  }
}

export async function loadShowerDayRecord(date = getLocalDateKey()) {
  const savedValue = await AsyncStorage.getItem(SHOWER_RECORD_KEY);
  return normalizeRecord(savedValue, date);
}

export async function saveShowerSession(
  selectedMinutes: ShowerDurationMinutes,
  actualSeconds: number,
  date = getLocalDateKey(),
) {
  const current = await loadShowerDayRecord(date);
  const session: ShowerSessionRecord = {
    id: `shower-${Date.now()}`,
    selectedMinutes,
    actualSeconds: Math.max(1, Math.floor(actualSeconds)),
    completedAt: new Date().toISOString(),
  };
  const nextRecord: ShowerDayRecord = {
    ...current,
    sessions: [...current.sessions, session],
    totalSeconds: current.totalSeconds + session.actualSeconds,
  };

  await AsyncStorage.setItem(SHOWER_RECORD_KEY, JSON.stringify(nextRecord));
  await clearActiveShowerTimer();
  return nextRecord;
}

export async function markShowerRewardProcessed(date = getLocalDateKey()) {
  const current = await loadShowerDayRecord(date);
  const nextRecord = { ...current, rewardProcessed: true };
  await AsyncStorage.setItem(SHOWER_RECORD_KEY, JSON.stringify(nextRecord));
  return nextRecord;
}

export async function saveActiveShowerTimer(timer: ActiveShowerTimer) {
  await AsyncStorage.setItem(ACTIVE_SHOWER_TIMER_KEY, JSON.stringify(timer));
}

export async function loadActiveShowerTimer(date = getLocalDateKey()) {
  const savedValue = await AsyncStorage.getItem(ACTIVE_SHOWER_TIMER_KEY);
  if (!savedValue) return null;

  try {
    const parsed = JSON.parse(savedValue) as Partial<ActiveShowerTimer>;
    if (parsed.date !== date) return null;
    const startedAt = Number(parsed.startedAt);
    if (!Number.isFinite(startedAt)) return null;
    return {
      date,
      startedAt,
      selectedMinutes: normalizeSelectedMinutes(parsed.selectedMinutes),
    };
  } catch {
    return null;
  }
}

export async function clearActiveShowerTimer() {
  await AsyncStorage.removeItem(ACTIVE_SHOWER_TIMER_KEY);
}

export function formatTimer(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getDisplayShowerMinutes(actualSeconds: number) {
  return Math.max(1, Math.round(actualSeconds / 60));
}
