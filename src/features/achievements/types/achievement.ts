export type AchievementDefinitionId =
  | 'first_xp'
  | 'steady_growth'
  | 'study_hours_10'
  | 'study_hours_50'
  | 'category_master'
  | 'completion_streak'
  | 'grape_collector';

export type AchievementStatus = 'locked' | 'earned';

export type AchievementDefinition = {
  id: AchievementDefinitionId;
  title: string;
  description: string;
  sortOrder: number;
};

export type AchievementProgress = {
  achievementId: AchievementDefinitionId;
  status: AchievementStatus;
  progressValue: number;
  targetValue: number;
  progressText: string;
  earnedAt: string | null;
  updatedAt: string | null;
};

export type AchievementSummary = AchievementDefinition & AchievementProgress;
