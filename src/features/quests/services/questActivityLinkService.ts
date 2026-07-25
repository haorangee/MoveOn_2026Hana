import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuth } from '@/config/firebaseAuth';
import { ACTIVITY_CATEGORY } from '@/features/activity/constants/activityCategory';
import {
  QuestError,
  completeQuest,
  getQuest,
} from '@/features/quests/services/questService';

const PENDING_WATER_QUEST_STORAGE_KEY = '@moveon/quests/pending-water-quest-id';

type RouteParamValue = string | string[] | null | undefined;

export type LinkCompletedActivityInput = {
  questId?: RouteParamValue;
  activityId?: string | null;
};

export type LinkCompletedActivityResult = {
  linked: boolean;
  alreadyProcessed: boolean;
};

export type PendingWaterQuestResolution =
  | {
      canLink: false;
      questId: null;
      shouldClear: false;
      reason: 'empty';
    }
  | {
      canLink: false;
      questId: string;
      shouldClear: true;
      reason: 'not_found' | 'skipped' | 'completed' | 'wrong_category' | 'invalid_status';
    }
  | {
      canLink: true;
      questId: string;
      shouldClear: false;
      reason: 'pending_water';
    };

export function getQuestRouteParam(value: RouteParamValue) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getSingleRouteParam(value: RouteParamValue) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

export function isFromQuestRoute(value: RouteParamValue) {
  return getSingleRouteParam(value) === '1';
}

export function getQuestLinkRouteParam({
  questId,
  fromQuest,
}: {
  questId?: RouteParamValue;
  fromQuest?: RouteParamValue;
}) {
  if (!isFromQuestRoute(fromQuest)) return null;
  return getSingleRouteParam(questId);
}

export async function linkCompletedActivityToQuest({
  questId,
  activityId,
}: LinkCompletedActivityInput): Promise<LinkCompletedActivityResult> {
  const normalizedQuestId = getQuestRouteParam(questId)?.trim();
  if (!normalizedQuestId) {
    return {
      linked: false,
      alreadyProcessed: false,
    };
  }

  const normalizedActivityId = activityId?.trim();
  if (!normalizedActivityId) {
    throw new Error('활동 기록 ID가 없어 퀘스트를 연결하지 못했어요.');
  }

  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;
  if (!user?.uid) {
    throw new Error('로그인 정보를 확인하지 못해 퀘스트를 연결하지 못했어요.');
  }

  const result = await completeQuest(user.uid, normalizedQuestId, {
    activityId: normalizedActivityId,
  });

  return {
    linked: true,
    alreadyProcessed: result.alreadyProcessed,
  };
}

export async function savePendingWaterQuestId(questId: RouteParamValue) {
  const normalizedQuestId = getQuestRouteParam(questId)?.trim();
  if (!normalizedQuestId) return false;
  await AsyncStorage.setItem(PENDING_WATER_QUEST_STORAGE_KEY, normalizedQuestId);
  return true;
}

export async function loadPendingWaterQuestId() {
  const value = await AsyncStorage.getItem(PENDING_WATER_QUEST_STORAGE_KEY);
  return value?.trim() || null;
}

export async function clearPendingWaterQuestIfMatches(questId: string) {
  const normalizedQuestId = questId.trim();
  if (!normalizedQuestId) return false;
  const currentQuestId = await loadPendingWaterQuestId();
  if (currentQuestId !== normalizedQuestId) return false;
  await AsyncStorage.removeItem(PENDING_WATER_QUEST_STORAGE_KEY);
  return true;
}

export async function clearPendingWaterQuestId(expectedQuestId?: string | null) {
  if (expectedQuestId) {
    await clearPendingWaterQuestIfMatches(expectedQuestId);
    return;
  }
  await AsyncStorage.removeItem(PENDING_WATER_QUEST_STORAGE_KEY);
}

export async function resolvePendingWaterQuestForLink(userId: string): Promise<PendingWaterQuestResolution> {
  const pendingQuestId = await loadPendingWaterQuestId();
  if (!pendingQuestId) {
    return {
      canLink: false,
      questId: null,
      shouldClear: false,
      reason: 'empty',
    };
  }

  const quest = await getQuest(userId, pendingQuestId);
  if (!quest) {
    return {
      canLink: false,
      questId: pendingQuestId,
      shouldClear: true,
      reason: 'not_found',
    };
  }

  if (quest.status === 'completed') {
    return {
      canLink: false,
      questId: pendingQuestId,
      shouldClear: true,
      reason: 'completed',
    };
  }

  if (quest.status === 'skipped') {
    return {
      canLink: false,
      questId: pendingQuestId,
      shouldClear: true,
      reason: 'skipped',
    };
  }

  if (quest.category !== ACTIVITY_CATEGORY.WATER) {
    return {
      canLink: false,
      questId: pendingQuestId,
      shouldClear: true,
      reason: 'wrong_category',
    };
  }

  if (quest.status !== 'pending') {
    return {
      canLink: false,
      questId: pendingQuestId,
      shouldClear: true,
      reason: 'invalid_status',
    };
  }

  return {
    canLink: true,
    questId: pendingQuestId,
    shouldClear: false,
    reason: 'pending_water',
  };
}

export function isNonRetryableQuestLinkError(error: unknown) {
  return error instanceof QuestError
    && (
      error.code === 'QUEST_NOT_FOUND'
      || error.code === 'QUEST_ALREADY_SKIPPED'
      || error.code === 'QUEST_ALREADY_COMPLETED'
      || error.code === 'QUEST_INVALID_TRANSITION'
    );
}
