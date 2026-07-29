import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { ACTIVITY_CATEGORY, type ActivityCategory } from '@/features/activity/constants/activityCategory';
import { ACTIVITY_STATUS } from '@/features/activity/constants/activityStatus';
import {
  categoryProgressRef,
  profileRef,
  rewardContextRef,
  rewardTransactionRef,
} from '@/features/activity/rewards/repositories/rewardRepository';
import { calculateActivityReward } from '@/features/activity/rewards/services/rewardCalculator';
import {
  calculateCategoryLevelProgress,
  calculateLevelChange,
  calculateTotalLevelProgress,
  CATEGORY_LEVEL_THRESHOLDS,
  TOTAL_LEVEL_THRESHOLDS,
} from '@/features/activity/levels';
import {
  emptyAchievementResult,
  processAchievementUnlocks,
} from '@/features/achievements/services/achievementService';
import { REWARD_REASON } from '@/features/activity/rewards/constants/rewardReason';
import type {
  CategoryRewardProgress,
  DailyRewardContext,
  ProcessActivityRewardResult,
  RewardTransaction,
} from '@/features/activity/rewards/types/reward';
import type { ActivityRecord } from '@/features/activity/types/activity';
import { createDateKey } from '@/features/activity/utils/dateKey';
import { REWARD_POLICY } from '@/features/activity/rewards/constants/rewardPolicy';

function isActivityCategory(value: unknown): value is ActivityCategory {
  return Object.values(ACTIVITY_CATEGORY).includes(value as ActivityCategory);
}

function getEffectiveRewardCategory(activity: ActivityRecord) {
  if (activity.rewardCategory !== undefined) return activity.rewardCategory;
  return isActivityCategory(activity.categoryId) ? activity.categoryId : null;
}

function rewardTransactionId(activityId: string) {
  return activityId;
}

function activityRecordRef(userId: string, activityId: string) {
  return doc(firestore, 'users', userId, 'activityRecords', activityId);
}

function defaultDailyContext(): DailyRewardContext {
  return {
    studyGrapesEarned: 0,
    cleaningXpRewardCount: 0,
    cleaningGrapeRewardCount: 0,
    showerXpRewardCount: 0,
    showerGrapeRewardCount: 0,
    waterRewardedCupCount: 0,
    waterGoalRewarded: false,
  };
}

function defaultCategoryProgress(categoryId: ActivityCategory): CategoryRewardProgress {
  return {
    categoryId,
    xp: 0,
    level: 1,
    completionCount: 0,
    totalGrapes: 0,
    lastRewardedAt: null,
    createdAt: null,
    updatedAt: null,
  };
}

function nextContextFromReward(
  activity: ActivityRecord,
  context: DailyRewardContext,
  reward: ReturnType<typeof calculateActivityReward>,
): DailyRewardContext {
  if ((activity.details as { type?: unknown }).type === 'quest') {
    return context;
  }

  switch (activity.categoryId) {
    case ACTIVITY_CATEGORY.STUDY:
      return { ...context, studyGrapesEarned: context.studyGrapesEarned + reward.earnedGrapes };
    case ACTIVITY_CATEGORY.CLEANING:
      return {
        ...context,
        cleaningXpRewardCount: context.cleaningXpRewardCount + (reward.earnedXp > 0 ? 1 : 0),
        cleaningGrapeRewardCount: context.cleaningGrapeRewardCount + (reward.earnedGrapes > 0 ? 1 : 0),
      };
    case ACTIVITY_CATEGORY.SHOWER:
      return {
        ...context,
        showerXpRewardCount: context.showerXpRewardCount + (reward.earnedXp > 0 ? 1 : 0),
        showerGrapeRewardCount: context.showerGrapeRewardCount + (reward.earnedGrapes > 0 ? 1 : 0),
      };
    case ACTIVITY_CATEGORY.WATER:
      return {
        ...context,
        waterRewardedCupCount: Math.min(
          REWARD_POLICY.water.dailyXpCupLimit,
          context.waterRewardedCupCount + (reward.breakdown.rewardedUnits ?? 0),
        ),
        waterGoalRewarded: context.waterGoalRewarded || reward.breakdown.bonusXp > 0 || reward.breakdown.bonusGrapes > 0,
      };
    default:
      return context;
  }
}

function emptyRewardResult(
  activity: ActivityRecord,
  reason: RewardTransaction['reason'],
  processed = false,
  alreadyProcessed = false,
  totalXp = 0,
  totalLevel = 1,
  categoryXp = 0,
  categoryLevel = 1,
  categoryId = getEffectiveRewardCategory(activity),
): ProcessActivityRewardResult {
  return {
    activityId: activity.activityId,
    categoryId,
    processed,
    alreadyProcessed,
    rewardApplied: false,
    earnedXp: 0,
    earnedGrapes: 0,
    newTotalXp: totalXp,
    newTotalLevel: totalLevel,
    newCategoryXp: categoryId === null ? null : categoryXp,
    newCategoryLevel: categoryId === null ? null : categoryLevel,
    ...emptyAchievementResult(),
    totalLevelChange: {
      previousLevel: totalLevel,
      newLevel: totalLevel,
      didLevelUp: false,
      levelsGained: 0,
    },
    categoryLevelChange: categoryId === null ? null : {
      previousLevel: categoryLevel,
      newLevel: categoryLevel,
      didLevelUp: false,
      levelsGained: 0,
    },
    reward: {
      activityId: activity.activityId,
      categoryId,
      earnedXp: 0,
      earnedGrapes: 0,
      isRewardEligible: false,
      reason,
      breakdown: {
        baseXp: 0,
        bonusXp: 0,
        baseGrapes: 0,
        bonusGrapes: 0,
        rewardedUnits: 0,
        dailyLimitApplied: false,
      },
    },
  };
}

export async function processActivityReward(activity: ActivityRecord): Promise<ProcessActivityRewardResult> {
  if (activity.status !== ACTIVITY_STATUS.COMPLETED) {
    return emptyRewardResult(activity, REWARD_REASON.ACTIVITY_NOT_COMPLETED);
  }

  const dateKey = activity.dateKey || createDateKey();
  const rewardId = rewardTransactionId(activity.activityId);

  const result = await runTransaction(firestore, async (transaction) => {
    const activityRef = activityRecordRef(activity.userId, activity.activityId);
    const transactionRef = rewardTransactionRef(activity.userId, rewardId);
    const contextRef = rewardContextRef(activity.userId, dateKey);
    const userRef = profileRef(activity.userId);

    const [activitySnap, transactionSnap, contextSnap, userSnap] = await Promise.all([
      transaction.get(activityRef),
      transaction.get(transactionRef),
      transaction.get(contextRef),
      transaction.get(userRef),
    ]);

    if (!activitySnap.exists()) {
      return emptyRewardResult(activity, REWARD_REASON.INVALID_ACTIVITY);
    }

    const currentActivity = activitySnap.data() as ActivityRecord;
    const previousTotalXp = Number((userSnap.exists() ? userSnap.data().totalXp : 0) ?? 0);
    const previousTotalLevel = calculateTotalLevelProgress(previousTotalXp);
    const currentContext = contextSnap.exists()
      ? (contextSnap.data() as DailyRewardContext)
      : defaultDailyContext();
    const reward = calculateActivityReward(currentActivity, currentContext);
    const effectiveRewardCategory = reward.categoryId;
    const progressRef = effectiveRewardCategory === null
      ? null
      : categoryProgressRef(currentActivity.userId, effectiveRewardCategory);
    const progressSnap = progressRef === null ? null : await transaction.get(progressRef);
    const currentProgress = effectiveRewardCategory === null
      ? null
      : progressSnap?.exists()
        ? (progressSnap.data() as CategoryRewardProgress)
        : defaultCategoryProgress(effectiveRewardCategory);

    if (currentActivity.status !== ACTIVITY_STATUS.COMPLETED) {
      return emptyRewardResult(
        currentActivity,
        REWARD_REASON.ACTIVITY_NOT_COMPLETED,
        false,
        currentActivity.rewardProcessed === true,
        previousTotalXp,
        previousTotalLevel.level,
        currentProgress?.xp ?? 0,
        currentProgress?.level ?? 1,
        effectiveRewardCategory,
      );
    }

    if (currentActivity.rewardProcessed || transactionSnap.exists()) {
      return emptyRewardResult(
        currentActivity,
        REWARD_REASON.ELIGIBLE,
        false,
        true,
        previousTotalXp,
        previousTotalLevel.level,
        currentProgress?.xp ?? 0,
        currentProgress?.level ?? 1,
        effectiveRewardCategory,
      );
    }

    const nextTotalXp = previousTotalXp + Math.max(0, Math.floor(reward.earnedXp));
    const nextTotalLevel = calculateTotalLevelProgress(nextTotalXp);
    const totalLevelChange = calculateLevelChange(previousTotalXp, nextTotalXp, TOTAL_LEVEL_THRESHOLDS);

    const nextCategoryXp = currentProgress === null
      ? null
      : currentProgress.xp + Math.max(0, Math.floor(reward.earnedXp));
    const nextCategoryLevel = nextCategoryXp === null
      ? null
      : calculateCategoryLevelProgress(nextCategoryXp);
    const categoryLevelChange = currentProgress === null || nextCategoryXp === null
      ? null
      : calculateLevelChange(currentProgress.xp, nextCategoryXp, CATEGORY_LEVEL_THRESHOLDS);

    const nextProgress = currentProgress === null || effectiveRewardCategory === null || nextCategoryLevel === null
      ? null
      : {
        categoryId: effectiveRewardCategory,
        xp: nextCategoryXp ?? currentProgress.xp,
        level: nextCategoryLevel.level,
        completionCount: currentProgress.completionCount + 1,
        totalGrapes: currentProgress.totalGrapes + Math.max(0, Math.floor(reward.earnedGrapes)),
        lastRewardedAt: serverTimestamp(),
        createdAt: currentProgress.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      } satisfies CategoryRewardProgress;

    const rewardTransaction: RewardTransaction = {
      rewardId,
      activityId: currentActivity.activityId,
      userId: currentActivity.userId,
      categoryId: effectiveRewardCategory,
      earnedXp: reward.earnedXp,
      earnedGrapes: reward.earnedGrapes,
      reason: reward.reason,
      breakdown: reward.breakdown,
      previousTotalLevel: previousTotalLevel.level,
      newTotalLevel: nextTotalLevel.level,
      previousCategoryLevel: currentProgress?.level,
      newCategoryLevel: nextCategoryLevel?.level,
      totalLevelUp: totalLevelChange.didLevelUp,
      categoryLevelUp: categoryLevelChange?.didLevelUp ?? false,
      levelChanges: {
        total: totalLevelChange,
        ...(categoryLevelChange ? { category: categoryLevelChange } : {}),
      },
      createdAt: serverTimestamp(),
    };

    transaction.set(transactionRef, rewardTransaction);
    transaction.set(userRef, {
      totalXp: nextTotalXp,
      level: nextTotalLevel.level,
      grapes: Math.max(0, Math.floor((userSnap.exists() ? userSnap.data().grapes : 0) ?? 0)) + Math.max(0, Math.floor(reward.earnedGrapes)),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    transaction.set(contextRef, {
      ...nextContextFromReward(currentActivity, currentContext, reward),
      dateKey,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    if (progressRef && nextProgress) {
      transaction.set(progressRef, nextProgress, { merge: true });
    }
    transaction.set(activityRef, {
      rewardProcessed: true,
      rewardProcessedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return {
      activityId: currentActivity.activityId,
      categoryId: effectiveRewardCategory,
      processed: true,
      alreadyProcessed: false,
      rewardApplied: reward.isRewardEligible,
      earnedXp: reward.earnedXp,
      earnedGrapes: reward.earnedGrapes,
      newTotalXp: nextTotalXp,
      newTotalLevel: nextTotalLevel.level,
      newCategoryXp: nextProgress?.xp ?? null,
      newCategoryLevel: nextProgress?.level ?? null,
      ...emptyAchievementResult(),
      totalLevelChange,
      categoryLevelChange,
      reward,
    };
  });

  if (!result.processed || result.alreadyProcessed) {
    return result;
  }

  try {
    const achievementResult = await processAchievementUnlocks(activity.userId, {
      triggerActivityId: result.activityId,
      triggerDateKey: dateKey,
    });
    return {
      ...result,
      ...achievementResult,
    };
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('Failed to process achievement rewards.', error);
    }
    return result;
  }
}
