import { firebaseAuth } from '@/config/firebaseAuth';
import {
  ACTIVITY_CATEGORY,
  type ActivityCategory,
} from '@/features/activity/constants/activityCategory';
import { ACTIVITY_STATUS } from '@/features/activity/constants/activityStatus';
import {
  createActivityRecordIfMissing,
  getActivityRecord,
} from '@/features/activity/repositories/activityRepository';
import { processActivityReward } from '@/features/activity/rewards/services/rewardService';
import type { ProcessActivityRewardResult } from '@/features/activity/rewards/types/reward';
import type {
  ActivityRecord,
  QuestActivityDetails,
} from '@/features/activity/types/activity';
import { createDateKey } from '@/features/activity/utils/dateKey';
import type { AIQuestExecutionType, AIQuestLevel } from '@/contracts/ai-quest';
import {
  QuestError,
  completeQuest,
  getQuest,
} from '@/features/quests/services/questService';

export type CompleteQuestActivityInput = {
  questId: string;
  title: string;
  executionType: Extract<AIQuestExecutionType, 'simple' | 'my_time'>;
  rewardCategory: ActivityCategory | null;
  aiQuestLevel?: AIQuestLevel;
  durationMinutes?: number;
};

export type CompleteQuestActivityResult = {
  activityId: string;
  questAlreadyProcessed: boolean;
  rewardResult: ProcessActivityRewardResult | null;
};

const MY_TIME_ALLOWED_MINUTES = [5, 10, 15] as const;

function questActivityId(questId: string) {
  return `quest-${questId.replace(/[^A-Za-z0-9_-]/g, '_')}`;
}

function assertPendingQuestStatus(status: string) {
  if (status === 'skipped') {
    throw new QuestError('QUEST_ALREADY_SKIPPED', '건너뛴 퀘스트는 완료할 수 없어요.');
  }
}

function normalizeQuestActivityDetails(input: CompleteQuestActivityInput): QuestActivityDetails {
  if (input.executionType === 'simple') {
    if (!input.aiQuestLevel) {
      throw new QuestError('QUEST_INVALID_INPUT', 'simple 퀘스트에는 AI 퀘스트 레벨이 필요해요.');
    }

    return {
      type: 'quest',
      questId: input.questId,
      title: input.title,
      executionType: input.executionType,
      aiQuestLevel: input.aiQuestLevel,
    };
  }

  const durationMinutes = Math.floor(Number(input.durationMinutes ?? 0));
  if (!MY_TIME_ALLOWED_MINUTES.includes(durationMinutes as typeof MY_TIME_ALLOWED_MINUTES[number])) {
    throw new QuestError('QUEST_INVALID_INPUT', 'My Time 퀘스트는 5, 10, 15분만 사용할 수 있어요.');
  }

  return {
    type: 'quest',
    questId: input.questId,
    title: input.title,
    executionType: input.executionType,
    durationMinutes,
  };
}

function createCompletedQuestActivityRecord(
  userId: string,
  activityId: string,
  input: CompleteQuestActivityInput,
): ActivityRecord {
  const now = new Date();
  const details = normalizeQuestActivityDetails(input);
  const rewardCategory = input.rewardCategory;

  return {
    activityId,
    userId,
    categoryId: rewardCategory ?? 'custom',
    rewardCategory,
    status: ACTIVITY_STATUS.COMPLETED,
    dateKey: createDateKey(now),
    startedAt: now,
    completedAt: now,
    durationMinutes: details.durationMinutes ?? 0,
    createdAt: now,
    updatedAt: now,
    source: 'app',
    details,
    dailySummaryProcessed: false,
    rewardProcessed: false,
  };
}

export async function completeQuestActivity(
  input: CompleteQuestActivityInput,
): Promise<CompleteQuestActivityResult> {
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;
  if (!user?.uid) {
    throw new QuestError('QUEST_INVALID_INPUT', '로그인 정보를 확인할 수 없어요.');
  }

  const quest = await getQuest(user.uid, input.questId);
  if (!quest) {
    throw new QuestError('QUEST_NOT_FOUND', '퀘스트를 찾을 수 없어요.');
  }

  assertPendingQuestStatus(quest.status);

  const activityId = quest.activityId ?? questActivityId(input.questId);
  if (quest.status === 'completed') {
    const existingActivity = await getActivityRecord(user.uid, activityId);
    return {
      activityId,
      questAlreadyProcessed: true,
      rewardResult: existingActivity ? await processActivityReward(existingActivity) : null,
    };
  }

  const activity = await createActivityRecordIfMissing(
    createCompletedQuestActivityRecord(user.uid, activityId, input),
  );
  const rewardResult = await processActivityReward(activity);
  await completeQuest(user.uid, input.questId, { activityId });

  return {
    activityId,
    questAlreadyProcessed: false,
    rewardResult,
  };
}

export function resolveQuestRewardCategory(categoryId: ActivityCategory | null | undefined) {
  if (!categoryId) return null;
  return Object.values(ACTIVITY_CATEGORY).includes(categoryId) ? categoryId : null;
}
