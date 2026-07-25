export type AchievementDefinitionId =
  | 'first_xp'
  | 'steady_growth'
  | 'study_hours_10'
  | 'study_hours_50'
  | 'category_master'
  | 'completion_streak'
  | 'grape_collector';

export type AchievementCategory = 'growth' | 'study' | 'category' | 'reward';

export type AchievementStatus = 'locked' | 'earned';

export type AchievementDefinition = {
  id: AchievementDefinitionId;
  category: AchievementCategory;
  title: string;
  description: string;
  rewardGrapes: number;
  targetValue: number;
  sortOrder: number;
};

export type AchievementRecord = {
  achievementId: AchievementDefinitionId;
  category: AchievementCategory;
  title: string;
  rewardGrapes: number;
  earnedAt: unknown;
  triggerActivityId: string | null;
  triggerDateKey: string | null;
  progressValue: number;
  targetValue: number;
  createdAt: unknown;
  updatedAt: unknown;
};

export type AchievementRewardTransaction = {
  achievementId: AchievementDefinitionId;
  userId: string;
  earnedGrapes: number;
  createdAt: unknown;
};

export type AchievementUnlockResult = {
  achievementId: AchievementDefinitionId;
  title: string;
  rewardGrapes: number;
};

export type AchievementProgress = {
  achievementId: AchievementDefinitionId;
  status: AchievementStatus;
  progressValue: number;
  targetValue: number;
  progressText: string;
  earnedAt: unknown;
};

export type AchievementSummary = AchievementDefinition & AchievementProgress;

export type ProcessAchievementResult = {
  unlockedAchievements: AchievementUnlockResult[];
  achievementGrapesEarned: number;
};
