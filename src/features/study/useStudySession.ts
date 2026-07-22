import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  createStudySessionState,
  DEFAULT_STUDY_DURATION_SECONDS,
  finishStudySession,
  pauseStudySession,
  refreshStudySession,
  resumeStudySession,
  startStudySession,
  type StudyCategory,
  type StudySessionResult,
  type StudySessionState,
} from '@/features/study/studySession';

export function useStudySession(
  initialCategory: StudyCategory,
  secondsPerPage: number,
  targetDurationSeconds = DEFAULT_STUDY_DURATION_SECONDS,
) {
  const [state, setState] = useState<StudySessionState>(() => (
    createStudySessionState(initialCategory, secondsPerPage, targetDurationSeconds)
  ));
  const stateRef = useRef(state);
  const mountedRef = useRef(true);

  const commit = useCallback((nextState: StudySessionState) => {
    stateRef.current = nextState;
    if (mountedRef.current) setState(nextState);
    return nextState;
  }, []);

  const refresh = useCallback((now = Date.now()) => {
    return commit(refreshStudySession(stateRef.current, now));
  }, [commit]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!state.isRunning) return undefined;

    const interval = setInterval(() => {
      refresh(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [refresh, state.isRunning]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refresh(Date.now());
    });

    return () => subscription.remove();
  }, [refresh]);

  const configure = useCallback((
    category: StudyCategory,
    pageSeconds: number,
    durationSeconds: number,
  ) => {
    if (stateRef.current.isRunning || stateRef.current.isPaused) return;
    commit(createStudySessionState(category, pageSeconds, durationSeconds));
  }, [commit]);

  const start = useCallback(() => {
    commit(startStudySession(stateRef.current, Date.now()));
  }, [commit]);

  const pause = useCallback(() => {
    commit(pauseStudySession(stateRef.current, Date.now()));
  }, [commit]);

  const resume = useCallback(() => {
    commit(resumeStudySession(stateRef.current, Date.now()));
  }, [commit]);

  const finish = useCallback((): StudySessionResult => {
    const finished = finishStudySession(stateRef.current, Date.now());
    commit(finished.state);
    return finished.result;
  }, [commit]);

  return {
    state,
    configure,
    start,
    pause,
    resume,
    refresh,
    finish,
  };
}
