import type { ActivityCategory } from '@/features/activity/constants/activityCategory';
import type { AchievementUnlockResult } from '@/features/achievements/types/achievement';
import type { RewardReason } from '@/features/activity/rewards/constants/rewardReason';
import type { LevelChange } from '@/features/activity/levels/types/level';

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
  categoryId: ActivityCategory | null;
  earnedXp: number;
  earnedGrapes: number;
  isRewardEligible: boolean;
  reason: RewardReason;
  breakdown: RewardBreakdown;
}

export interface ProcessActivityRewardResult {
  activityId: string;
  categoryId: ActivityCategory | null;
  processed: boolean;
  alreadyProcessed: boolean;
  rewardApplied: boolean;
  earnedXp: number;
  earnedGrapes: number;
  newTotalXp: number;
  newTotalLevel: number;
  newCategoryXp: number | null;
  newCategoryLevel: number | null;
  unlockedAchievements: AchievementUnlockResult[];
  achievementGrapesEarned: number;
  totalLevelChange: LevelChange;
  categoryLevelChange: LevelChange | null;
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
  categoryId: ActivityCategory | null;
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
    category?: {
      previousLevel: number;
      newLevel: number;
      didLevelUp: boolean;
      levelsGained: number;
    };
  };
  createdAt: unknown;
};
