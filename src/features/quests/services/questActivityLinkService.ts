import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuth } from '@/config/firebaseAuth';
import { completeQuest } from '@/features/quests/services/questService';

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

export function getQuestRouteParam(value: RouteParamValue) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function isFromQuestRoute(value: RouteParamValue) {
  return getQuestRouteParam(value) === '1';
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

export async function clearPendingWaterQuestId(expectedQuestId?: string | null) {
  const currentQuestId = await loadPendingWaterQuestId();
  if (!currentQuestId) return;
  if (expectedQuestId && currentQuestId !== expectedQuestId) return;
  await AsyncStorage.removeItem(PENDING_WATER_QUEST_STORAGE_KEY);
}
