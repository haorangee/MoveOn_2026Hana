import { collection, doc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { ACTIVITY_CATEGORY } from '@/features/activity/constants/activityCategory';
import { ACTIVITY_STATUS } from '@/features/activity/constants/activityStatus';
import {
  createActivityRecord,
  getActivityRecord,
  updateActivityRecord,
  updateDailySummary,
} from '@/features/activity/repositories/activityRepository';
import { processActivityReward } from '@/features/activity/rewards/services/rewardService';
import { createDateKey } from '@/features/activity/utils/dateKey';
import type { ProcessActivityRewardResult } from '@/features/activity/rewards/types/reward';
import type {
  ActivityRecord,
  CleaningActivityDetails,
  ShowerActivityDetails,
  StudyActivityDetails,
  WaterActivityDetails,
} from '@/features/activity/types/activity';

function createRecordId() {
  return doc(collection(firestore, '_activityIds')).id;
}

function createBaseRecord(
  userId: string,
  categoryId: ActivityRecord['categoryId'],
  source: ActivityRecord['source'],
  details: ActivityRecord['details'],
): ActivityRecord {
  const now = new Date();
  return {
    activityId: createRecordId(),
    userId,
    categoryId,
    status: ACTIVITY_STATUS.IN_PROGRESS,
    dateKey: createDateKey(now),
    startedAt: now,
    completedAt: null,
    durationMinutes: 0,
    createdAt: now,
    updatedAt: now,
    source,
    details,
    dailySummaryProcessed: false,
    rewardProcessed: false,
  };
}

export async function startStudyActivity(
  userId: string,
  details: StudyActivityDetails = {},
  source: ActivityRecord['source'] = 'app',
) {
  const record = createBaseRecord(userId, ACTIVITY_CATEGORY.STUDY, source, details);
  await createActivityRecord(record);
  return record;
}

export async function completeStudyActivity(
  userId: string,
  activityId: string,
  details: Partial<StudyActivityDetails> & { actualMinutes: number },
  durationMinutes: number,
): Promise<ProcessActivityRewardResult | null> {
  const existing = await getActivityRecord(userId, activityId);
  await updateActivityRecord(userId, activityId, {
    status: ACTIVITY_STATUS.COMPLETED,
    completedAt: new Date(),
    durationMinutes,
    details: {
      ...(existing?.details as StudyActivityDetails | undefined),
      ...details,
    },
  });
  await updateDailySummary(userId, createDateKey(), (current) => {
    const completedCategories = new Set(current.completedCategories);
    completedCategories.add(ACTIVITY_CATEGORY.STUDY);
    return {
      ...current,
      studyMinutes: current.studyMinutes + durationMinutes,
      studySessionCount: current.studySessionCount + 1,
      completedCategories: Array.from(completedCategories),
    };
  });
  const updated = await getActivityRecord(userId, activityId);
  if (updated) return processActivityReward(updated);
  return null;
}

export async function startCleaningActivity(
  userId: string,
  details: CleaningActivityDetails = {},
) {
  const record = createBaseRecord(userId, ACTIVITY_CATEGORY.CLEANING, 'app', details);
  await createActivityRecord(record);
  return record;
}

export async function updateCleaningBeforeImage(
  userId: string,
  activityId: string,
  details: Partial<CleaningActivityDetails>,
) {
  const existing = await getActivityRecord(userId, activityId);
  await updateActivityRecord(userId, activityId, {
    details: {
      ...(existing?.details as CleaningActivityDetails | undefined),
      ...details,
    },
  });
}

export async function updateCleaningAfterImage(
  userId: string,
  activityId: string,
  details: Partial<CleaningActivityDetails>,
) {
  const existing = await getActivityRecord(userId, activityId);
  await updateActivityRecord(userId, activityId, {
    details: {
      ...(existing?.details as CleaningActivityDetails | undefined),
      ...details,
    },
  });
}

export async function completeCleaningActivity(
  userId: string,
  activityId: string,
  details: CleaningActivityDetails = {},
): Promise<ProcessActivityRewardResult | null> {
  const existing = await getActivityRecord(userId, activityId);
  await updateActivityRecord(userId, activityId, {
    status: ACTIVITY_STATUS.COMPLETED,
    completedAt: new Date(),
    durationMinutes: 0,
    details: {
      ...(existing?.details as CleaningActivityDetails | undefined),
      ...details,
    },
  });
  await updateDailySummary(userId, createDateKey(), (current) => {
    const completedCategories = new Set(current.completedCategories);
    completedCategories.add(ACTIVITY_CATEGORY.CLEANING);
    return {
      ...current,
      cleaningCompletedCount: current.cleaningCompletedCount + 1,
      completedCategories: Array.from(completedCategories),
    };
  });
  const updated = await getActivityRecord(userId, activityId);
  if (updated) return processActivityReward(updated);
  return null;
}

export async function completeShowerActivity(
  userId: string,
  details: ShowerActivityDetails = {},
): Promise<ProcessActivityRewardResult | null> {
  const record = createBaseRecord(userId, ACTIVITY_CATEGORY.SHOWER, 'app', details);
  await createActivityRecord(record);
  await updateActivityRecord(userId, record.activityId, {
    status: ACTIVITY_STATUS.COMPLETED,
    completedAt: new Date(),
    durationMinutes: 0,
    details,
  });
  await updateDailySummary(userId, createDateKey(), (current) => {
    const completedCategories = new Set(current.completedCategories);
    completedCategories.add(ACTIVITY_CATEGORY.SHOWER);
    return {
      ...current,
      showerCompletedCount: current.showerCompletedCount + 1,
      completedCategories: Array.from(completedCategories),
    };
  });
  const updated = await getActivityRecord(userId, record.activityId);
  if (updated) return processActivityReward(updated);
  return null;
}

export async function recordWaterActivity(
  userId: string,
  details: WaterActivityDetails = {},
): Promise<ProcessActivityRewardResult | null> {
  const normalizedDetails = {
    amountMl: details.amountMl ?? 250,
    cupCount: details.cupCount ?? 1,
  };
  const record = createBaseRecord(userId, ACTIVITY_CATEGORY.WATER, 'app', normalizedDetails);
  await createActivityRecord(record);
  await updateActivityRecord(userId, record.activityId, {
    status: ACTIVITY_STATUS.COMPLETED,
    completedAt: new Date(),
    durationMinutes: 0,
    details: normalizedDetails,
  });
  await updateDailySummary(userId, createDateKey(), (current) => {
    const completedCategories = new Set(current.completedCategories);
    completedCategories.add(ACTIVITY_CATEGORY.WATER);
    return {
      ...current,
      waterCupCount: current.waterCupCount + normalizedDetails.cupCount,
      waterAmountMl: current.waterAmountMl + normalizedDetails.amountMl,
      completedCategories: Array.from(completedCategories),
    };
  });
  const updated = await getActivityRecord(userId, record.activityId);
  if (updated) return processActivityReward(updated);
  return null;
}

export async function cancelActivity(userId: string, activityId: string) {
  await updateActivityRecord(userId, activityId, {
    status: ACTIVITY_STATUS.CANCELLED,
    completedAt: new Date(),
  });
}
