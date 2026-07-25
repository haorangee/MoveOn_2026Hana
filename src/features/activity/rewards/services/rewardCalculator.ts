import { ACTIVITY_CATEGORY } from '@/features/activity/constants/activityCategory';
import { ACTIVITY_STATUS } from '@/features/activity/constants/activityStatus';
import { REWARD_POLICY } from '@/features/activity/rewards/constants/rewardPolicy';
import { REWARD_REASON, type RewardReason } from '@/features/activity/rewards/constants/rewardReason';
import type { DailyRewardContext, ActivityRewardResult, RewardBreakdown } from '@/features/activity/rewards/types/reward';
import type { ActivityRecord } from '@/features/activity/types/activity';

function zeroBreakdown(): RewardBreakdown {
  return {
    baseXp: 0,
    bonusXp: 0,
    baseGrapes: 0,
    bonusGrapes: 0,
    rewardedUnits: 0,
    dailyLimitApplied: false,
  };
}

function finishResult(
  activity: ActivityRecord,
  earnedXp: number,
  earnedGrapes: number,
  reason: RewardReason,
  breakdown: RewardBreakdown,
): ActivityRewardResult {
  return {
    activityId: activity.activityId,
    categoryId: activity.categoryId,
    earnedXp: Math.max(0, Math.floor(earnedXp)),
    earnedGrapes: Math.max(0, Math.floor(earnedGrapes)),
    isRewardEligible: reason === REWARD_REASON.ELIGIBLE,
    reason,
    breakdown: {
      ...breakdown,
      baseXp: Math.max(0, Math.floor(breakdown.baseXp)),
      bonusXp: Math.max(0, Math.floor(breakdown.bonusXp)),
      baseGrapes: Math.max(0, Math.floor(breakdown.baseGrapes)),
      bonusGrapes: Math.max(0, Math.floor(breakdown.bonusGrapes)),
      rewardedUnits: Math.max(0, Math.floor(breakdown.rewardedUnits)),
    },
  };
}

function readMinutes(activity: ActivityRecord) {
  const details = activity.details as Record<string, unknown>;
  const actualMinutes = typeof details.actualMinutes === 'number' ? details.actualMinutes : null;
  const durationMinutes = typeof activity.durationMinutes === 'number' ? activity.durationMinutes : null;
  const fallback = actualMinutes ?? durationMinutes ?? 0;
  return Math.max(0, Math.floor(fallback));
}

export function calculateStudyReward(
  activity: ActivityRecord,
  context: DailyRewardContext,
): ActivityRewardResult {
  if (activity.categoryId !== ACTIVITY_CATEGORY.STUDY) {
    return finishResult(activity, 0, 0, REWARD_REASON.INVALID_ACTIVITY, zeroBreakdown());
  }
  if (activity.status !== ACTIVITY_STATUS.COMPLETED) {
    return finishResult(activity, 0, 0, REWARD_REASON.ACTIVITY_NOT_COMPLETED, zeroBreakdown());
  }

  const totalMinutes = readMinutes(activity);
  if (totalMinutes < REWARD_POLICY.study.minimumMinutes) {
    return finishResult(activity, 0, 0, REWARD_REASON.BELOW_MINIMUM_DURATION, zeroBreakdown());
  }

  const limitedMinutes = Math.min(totalMinutes, REWARD_POLICY.study.maximumSessionMinutes);
  const baseXp = Math.floor(limitedMinutes / REWARD_POLICY.study.xpUnitMinutes) * REWARD_POLICY.study.xpPerUnit;
  const rewardedGrapeUnits = Math.floor(limitedMinutes / REWARD_POLICY.study.grapeUnitMinutes);
  const availableGrapeUnits = Math.max(0, REWARD_POLICY.study.dailyGrapeLimit - context.studyGrapesEarned);
  const baseGrapes = Math.min(rewardedGrapeUnits, availableGrapeUnits) * REWARD_POLICY.study.grapesPerUnit;
  const dailyLimitApplied = rewardedGrapeUnits > availableGrapeUnits;

  return finishResult(
    activity,
    baseXp,
    baseGrapes,
    REWARD_REASON.ELIGIBLE,
    {
      baseXp,
      bonusXp: 0,
      baseGrapes,
      bonusGrapes: 0,
      rewardedUnits: Math.floor(limitedMinutes / REWARD_POLICY.study.xpUnitMinutes),
      dailyLimitApplied,
    },
  );
}

export function calculateCleaningReward(
  activity: ActivityRecord,
  context: DailyRewardContext,
): ActivityRewardResult {
  if (activity.categoryId !== ACTIVITY_CATEGORY.CLEANING) {
    return finishResult(activity, 0, 0, REWARD_REASON.INVALID_ACTIVITY, zeroBreakdown());
  }
  if (activity.status !== ACTIVITY_STATUS.COMPLETED) {
    return finishResult(activity, 0, 0, REWARD_REASON.ACTIVITY_NOT_COMPLETED, zeroBreakdown());
  }

  const xpEligible = context.cleaningXpRewardCount < REWARD_POLICY.cleaning.dailyXpRewardCountLimit;
  const grapesEligible = context.cleaningGrapeRewardCount < REWARD_POLICY.cleaning.dailyGrapeRewardCountLimit;

  if (!xpEligible && !grapesEligible) {
    return finishResult(activity, 0, 0, REWARD_REASON.DAILY_XP_LIMIT_REACHED, zeroBreakdown());
  }

  const earnedXp = xpEligible ? REWARD_POLICY.cleaning.xpPerCompletion : 0;
  const earnedGrapes = grapesEligible ? REWARD_POLICY.cleaning.grapesForFirstCompletion : 0;

  return finishResult(activity, earnedXp, earnedGrapes, REWARD_REASON.ELIGIBLE, {
    baseXp: earnedXp,
    bonusXp: 0,
    baseGrapes: earnedGrapes,
    bonusGrapes: 0,
    rewardedUnits: 1,
    dailyLimitApplied: !xpEligible || !grapesEligible,
  });
}

export function calculateShowerReward(
  activity: ActivityRecord,
  context: DailyRewardContext,
): ActivityRewardResult {
  if (activity.categoryId !== ACTIVITY_CATEGORY.SHOWER) {
    return finishResult(activity, 0, 0, REWARD_REASON.INVALID_ACTIVITY, zeroBreakdown());
  }
  if (activity.status !== ACTIVITY_STATUS.COMPLETED) {
    return finishResult(activity, 0, 0, REWARD_REASON.ACTIVITY_NOT_COMPLETED, zeroBreakdown());
  }

  const xpEligible = context.showerXpRewardCount < REWARD_POLICY.shower.dailyXpRewardCountLimit;
  const grapesEligible = context.showerGrapeRewardCount < REWARD_POLICY.shower.dailyGrapeRewardCountLimit;

  if (!xpEligible && !grapesEligible) {
    return finishResult(activity, 0, 0, REWARD_REASON.DAILY_XP_LIMIT_REACHED, zeroBreakdown());
  }

  const earnedXp = xpEligible ? REWARD_POLICY.shower.xpPerCompletion : 0;
  const earnedGrapes = grapesEligible ? REWARD_POLICY.shower.grapesForFirstCompletion : 0;

  return finishResult(activity, earnedXp, earnedGrapes, REWARD_REASON.ELIGIBLE, {
    baseXp: earnedXp,
    bonusXp: 0,
    baseGrapes: earnedGrapes,
    bonusGrapes: 0,
    rewardedUnits: 1,
    dailyLimitApplied: !xpEligible || !grapesEligible,
  });
}

export function calculateWaterReward(
  activity: ActivityRecord,
  context: DailyRewardContext,
): ActivityRewardResult {
  if (activity.categoryId !== ACTIVITY_CATEGORY.WATER) {
    return finishResult(activity, 0, 0, REWARD_REASON.INVALID_ACTIVITY, zeroBreakdown());
  }
  if (activity.status !== ACTIVITY_STATUS.COMPLETED) {
    return finishResult(activity, 0, 0, REWARD_REASON.ACTIVITY_NOT_COMPLETED, zeroBreakdown());
  }

  const details = activity.details as Record<string, unknown>;
  const cupCount = typeof details.cupCount === 'number' ? Math.max(0, Math.floor(details.cupCount)) : 0;
  if (cupCount <= 0) {
    return finishResult(activity, 0, 0, REWARD_REASON.INVALID_ACTIVITY, zeroBreakdown());
  }

  const alreadyRewarded = Math.min(context.waterRewardedCupCount, REWARD_POLICY.water.dailyXpCupLimit);
  const remainingRewardableCups = Math.max(0, REWARD_POLICY.water.dailyXpCupLimit - alreadyRewarded);
  const rewardedCups = Math.min(cupCount, remainingRewardableCups);
  const baseXp = rewardedCups * REWARD_POLICY.water.xpPerCup;
  const currentGoalCupCount = alreadyRewarded + rewardedCups;
  const goalBonusEligible = !context.waterGoalRewarded && currentGoalCupCount >= REWARD_POLICY.water.dailyGoalCupCount;
  const bonusXp = goalBonusEligible ? REWARD_POLICY.water.goalBonusXp : 0;
  const bonusGrapes = goalBonusEligible ? REWARD_POLICY.water.goalBonusGrapes : 0;

  return finishResult(activity, baseXp + bonusXp, bonusGrapes, REWARD_REASON.ELIGIBLE, {
    baseXp,
    bonusXp,
    baseGrapes: 0,
    bonusGrapes,
    rewardedUnits: rewardedCups,
    dailyLimitApplied: cupCount > rewardedCups,
  });
}

export function calculateActivityReward(
  activity: ActivityRecord,
  context: DailyRewardContext,
): ActivityRewardResult {
  switch (activity.categoryId) {
    case ACTIVITY_CATEGORY.STUDY:
      return calculateStudyReward(activity, context);
    case ACTIVITY_CATEGORY.CLEANING:
      return calculateCleaningReward(activity, context);
    case ACTIVITY_CATEGORY.SHOWER:
      return calculateShowerReward(activity, context);
    case ACTIVITY_CATEGORY.WATER:
      return calculateWaterReward(activity, context);
    default:
      return finishResult(activity, 0, 0, REWARD_REASON.INVALID_ACTIVITY, zeroBreakdown());
  }
}
