import type { ActivityCategory } from '@/features/activity/constants/activityCategory';
import type { RewardReason } from '@/features/activity/rewards/constants/rewardReason';

export interface RewardBreakdown {
  baseXp: number;
  bonusXp: number;
  baseGrapes: number;
  bonusGrapes: number;
  rewardedUnits: number;
  dailyLimitApplied: boolean;
}

export interface ActivityRewardResult {
  activityId: string;
  categoryId: ActivityCategory;
  earnedXp: number;
  earnedGrapes: number;
  isRewardEligible: boolean;
  reason: RewardReason;
  breakdown: RewardBreakdown;
}

export interface ProcessActivityRewardResult {
  activityId: string;
  categoryId: ActivityCategory;
  processed: boolean;
  alreadyProcessed: boolean;
  rewardApplied: boolean;
  earnedXp: number;
  earnedGrapes: number;
  newTotalXp: number;
  newTotalLevel: number;
  newCategoryXp: number;
  newCategoryLevel: number;
  totalLevelChange: import('@/features/activity/levels/types/level').LevelChange;
  categoryLevelChange: import('@/features/activity/levels/types/level').LevelChange;
  reward: ActivityRewardResult;
}

export interface DailyRewardContext {
  studyGrapesEarned: number;
  cleaningXpRewardCount: number;
  cleaningGrapeRewardCount: number;
  showerXpRewardCount: number;
  showerGrapeRewardCount: number;
  waterRewardedCupCount: number;
  waterGoalRewarded: boolean;
}

export interface CategoryRewardProgress {
  categoryId: ActivityCategory;
  xp: number;
  level: number;
  completionCount: number;
  totalGrapes: number;
  lastRewardedAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

export type RewardTransaction = {
  rewardId: string;
  activityId: string;
  userId: string;
  categoryId: ActivityCategory;
  earnedXp: number;
  earnedGrapes: number;
  reason: RewardReason;
  breakdown: RewardBreakdown;
  previousTotalLevel?: number;
  newTotalLevel?: number;
  previousCategoryLevel?: number;
  newCategoryLevel?: number;
  totalLevelUp?: boolean;
  categoryLevelUp?: boolean;
  levelChanges?: {
    total: {
      previousLevel: number;
      newLevel: number;
      didLevelUp: boolean;
      levelsGained: number;
    };
    category: {
      previousLevel: number;
      newLevel: number;
      didLevelUp: boolean;
      levelsGained: number;
    };
  };
  createdAt: unknown;
};
