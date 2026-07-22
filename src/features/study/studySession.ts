import { PROGRESSION } from '@/config/progression';

export type StudyCategory = {
  id: string;
  label: string;
  color: string;
};

export const studyCategories: StudyCategory[] = [
  { id: 'coding', label: '코딩 공부', color: '#7696B8' },
  { id: 'language', label: '어학 공부', color: '#D69AA6' },
  { id: 'startup', label: '창업 활동', color: '#809878' },
  { id: 'club', label: '동아리 활동', color: '#D8B96F' },
  { id: 'license', label: '자격증 공부', color: '#9785AB' },
  { id: 'school', label: '학교 공부', color: '#87B6C8' },
  { id: 'reading', label: '독서', color: '#98745A' },
  { id: 'free', label: '자유 활동', color: '#8C8C84' },
];

export const PRODUCTION_SECONDS_PER_PAGE = PROGRESSION.secondsPerPage;
export const DEVELOPMENT_SECONDS_PER_PAGE = 10;

export type StudySessionState = {
  startedAt: number | null;
  elapsedMs: number;
  isRunning: boolean;
  isPaused: boolean;
  category: StudyCategory;
  completedPages: number;
  currentPageProgress: number;
  secondsPerPage: number;
};

export type StudySessionResult = {
  startedAt: string;
  endedAt: string;
  elapsedMs: number;
  elapsedSeconds: number;
  category: StudyCategory;
  completedPages: number;
  currentPageProgress: number;
};

type StudyProgress = Pick<
  StudySessionState,
  'completedPages' | 'currentPageProgress'
>;

export function calculateStudyProgress(
  elapsedMs: number,
  secondsPerPage: number,
): StudyProgress {
  const elapsedSeconds = Math.max(0, elapsedMs) / 1000;
  const safeSecondsPerPage = Math.max(1, secondsPerPage);

  return {
    completedPages: Math.floor(elapsedSeconds / safeSecondsPerPage),
    currentPageProgress: (elapsedSeconds % safeSecondsPerPage) / safeSecondsPerPage,
  };
}

export function createStudySessionState(
  category: StudyCategory = studyCategories[0],
  secondsPerPage: number = PRODUCTION_SECONDS_PER_PAGE,
): StudySessionState {
  return {
    startedAt: null,
    elapsedMs: 0,
    isRunning: false,
    isPaused: false,
    category,
    completedPages: 0,
    currentPageProgress: 0,
    secondsPerPage,
  };
}

export function refreshStudySession(
  state: StudySessionState,
  now = Date.now(),
): StudySessionState {
  if (!state.isRunning || state.startedAt === null) return state;

  const elapsedMs = Math.max(0, now - state.startedAt);
  return {
    ...state,
    elapsedMs,
    ...calculateStudyProgress(elapsedMs, state.secondsPerPage),
  };
}

export function startStudySession(
  state: StudySessionState,
  now = Date.now(),
): StudySessionState {
  return refreshStudySession({
    ...state,
    startedAt: now - state.elapsedMs,
    isRunning: true,
    isPaused: false,
  }, now);
}

export function pauseStudySession(
  state: StudySessionState,
  now = Date.now(),
): StudySessionState {
  const refreshed = refreshStudySession(state, now);
  return {
    ...refreshed,
    startedAt: null,
    isRunning: false,
    isPaused: true,
  };
}

export function resumeStudySession(
  state: StudySessionState,
  now = Date.now(),
): StudySessionState {
  return startStudySession(state, now);
}

export function finishStudySession(
  state: StudySessionState,
  now = Date.now(),
): { state: StudySessionState; result: StudySessionResult } {
  const refreshed = refreshStudySession(state, now);
  const finishedState = {
    ...refreshed,
    startedAt: null,
    isRunning: false,
    isPaused: false,
  };

  return {
    state: finishedState,
    result: {
      startedAt: new Date(now - refreshed.elapsedMs).toISOString(),
      endedAt: new Date(now).toISOString(),
      elapsedMs: refreshed.elapsedMs,
      elapsedSeconds: Math.floor(refreshed.elapsedMs / 1000),
      category: refreshed.category,
      completedPages: refreshed.completedPages,
      currentPageProgress: refreshed.currentPageProgress,
    },
  };
}

export function formatElapsedTime(elapsedMs: number) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
}

export function getSecondsUntilNextPage(state: StudySessionState) {
  const elapsedSeconds = state.elapsedMs / 1000;
  const secondsIntoPage = elapsedSeconds % state.secondsPerPage;
  return Math.max(0, Math.ceil(state.secondsPerPage - secondsIntoPage));
}

export function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}
