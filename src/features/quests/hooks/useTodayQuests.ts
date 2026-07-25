import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Quest } from '../../../contracts/quest';
import type {
  CompleteQuestInput,
  CreateQuestInput,
  QuestMutationResult,
  UpdateQuestInput,
} from '../types/questInput';
import {
  QuestError,
  completeQuest as completeQuestService,
  createQuest as createQuestService,
  deleteQuest as deleteQuestService,
  getTodayQuests as getTodayQuestsService,
  skipQuest as skipQuestService,
  updateQuest as updateQuestService,
} from '../services/questService';

type LoadOptions = {
  quiet?: boolean;
  refreshing?: boolean;
};

type MutationAction<T> = (userId: string) => Promise<T>;

function errorMessage(error: unknown) {
  if (error instanceof QuestError) {
    switch (error.code) {
      case 'QUEST_NOT_FOUND':
        return '퀘스트를 찾을 수 없어요.';
      case 'QUEST_INVALID_INPUT':
        return '적어 준 내용을 다시 확인해 주세요.';
      case 'QUEST_INVALID_TRANSITION':
        return '지금 상태에서는 변경할 수 없어요.';
      case 'QUEST_COMPLETED_DELETE_FORBIDDEN':
        return '완료한 퀘스트는 오늘의 기록으로 남겨 둘게요.';
      case 'QUEST_ALREADY_COMPLETED':
        return '이미 완료한 퀘스트예요.';
      case 'QUEST_ALREADY_SKIPPED':
        return '이미 쉬어간 퀘스트예요.';
      default:
        return '퀘스트를 처리할 수 없어요.';
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return '퀘스트를 처리할 수 없어요.';
}

export function useTodayQuests() {
  const { isReady, user } = useAuth();
  const mountedRef = useRef(true);
  const activeOperationRef = useRef<string | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingQuestId, setProcessingQuestId] = useState<string | null>(null);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const loadQuests = useCallback(async (options: LoadOptions = {}) => {
    if (!isReady) return;

    if (!user?.uid) {
      if (!mountedRef.current) return;
      setQuests([]);
      setError('로그인이 필요해요. 내 방에 들어간 뒤 다시 열어 주세요.');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (options.refreshing) {
      setIsRefreshing(true);
    } else if (!options.quiet) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const todayQuests = await getTodayQuestsService(user.uid);
      if (!mountedRef.current) return;
      setQuests(todayQuests);
    } catch (loadError) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('Failed to load today quests.', loadError);
      }
      if (!mountedRef.current) return;
      setError(errorMessage(loadError));
    } finally {
      if (!mountedRef.current) return;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isReady, user?.uid]);

  useEffect(() => {
    void loadQuests();
  }, [loadQuests]);

  const runMutation = useCallback(async <T,>(
    processingId: string,
    action: MutationAction<T>,
  ) => {
    if (activeOperationRef.current) {
      throw new Error('이미 다른 퀘스트를 처리하고 있어요.');
    }
    if (!user?.uid) {
      const message = '로그인이 필요해요. 내 방에 들어간 뒤 다시 시도해 주세요.';
      setError(message);
      throw new Error(message);
    }

    activeOperationRef.current = processingId;
    setProcessingQuestId(processingId);
    setError(null);

    try {
      const result = await action(user.uid);
      await loadQuests({ quiet: true });
      return result;
    } catch (mutationError) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('Failed to mutate quest.', mutationError);
      }
      const message = errorMessage(mutationError);
      if (mountedRef.current) setError(message);
      throw new Error(message);
    } finally {
      activeOperationRef.current = null;
      if (mountedRef.current) setProcessingQuestId(null);
    }
  }, [loadQuests, user?.uid]);

  const createQuest = useCallback((input: CreateQuestInput) => (
    runMutation('create', (userId) => createQuestService(userId, input))
  ), [runMutation]);

  const updateQuest = useCallback((questId: string, input: UpdateQuestInput) => (
    runMutation(questId, (userId) => updateQuestService(userId, questId, input))
  ), [runMutation]);

  const deleteQuest = useCallback((questId: string) => (
    runMutation(questId, (userId) => deleteQuestService(userId, questId))
  ), [runMutation]);

  const completeQuest = useCallback((
    questId: string,
    input: CompleteQuestInput = {},
  ): Promise<QuestMutationResult> => (
    runMutation(questId, (userId) => completeQuestService(userId, questId, input))
  ), [runMutation]);

  const skipQuest = useCallback((questId: string): Promise<QuestMutationResult> => (
    runMutation(questId, (userId) => skipQuestService(userId, questId))
  ), [runMutation]);

  return {
    quests,
    isLoading,
    isRefreshing,
    error,
    reload: loadQuests,
    refresh: () => loadQuests({ refreshing: true }),
    createQuest,
    updateQuest,
    deleteQuest,
    completeQuest,
    skipQuest,
    processingQuestId,
  };
}
