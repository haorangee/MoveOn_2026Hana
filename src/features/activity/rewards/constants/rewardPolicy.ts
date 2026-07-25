import { ACTIVITY_CATEGORY } from '@/features/activity/constants/activityCategory';

export const REWARD_POLICY = {
  study: {
    minimumMinutes: 10,
    xpUnitMinutes: 5,
    xpPerUnit: 1,
    grapeUnitMinutes: 30,
    grapesPerUnit: 1,
    maximumSessionMinutes: 180,
    dailyGrapeLimit: 6,
  },
  cleaning: {
    xpPerCompletion: 20,
    grapesForFirstCompletion: 3,
    dailyXpRewardCountLimit: 2,
    dailyGrapeRewardCountLimit: 1,
  },
  shower: {
    xpPerCompletion: 5,
    grapesForFirstCompletion: 1,
    dailyXpRewardCountLimit: 2,
    dailyGrapeRewardCountLimit: 1,
  },
  water: {
    xpPerCup: 1,
    dailyXpCupLimit: 5,
    dailyGoalCupCount: 5,
    goalBonusXp: 2,
    goalBonusGrapes: 2,
  },
} as const;

export const REWARD_CATEGORY_ORDER = [
  ACTIVITY_CATEGORY.STUDY,
  ACTIVITY_CATEGORY.CLEANING,
  ACTIVITY_CATEGORY.SHOWER,
  ACTIVITY_CATEGORY.WATER,
] as const;
