import type { ActivityCategory } from '../features/activity/constants/activityCategory';

export type QuestCategory = ActivityCategory | 'custom';

export type QuestDifficulty = 'easy' | 'normal' | 'hard';

export type QuestSource =
  | 'system'
  | 'user'
  | 'ai'
  | 'fallback';

export type QuestStatus =
  | 'pending'
  | 'completed'
  | 'skipped';

export type ContractDateTime =
  | string
  | Date
  | {
      toDate(): Date;
    }
  | null;

export interface Quest {
  id: string;
  title: string;
  description?: string;
  category: QuestCategory;
  customCategoryLabel?: string;
  rewardCategory?: ActivityCategory | null;
  estimatedMinutes: number;
  difficulty: QuestDifficulty;
  source: QuestSource;
  status: QuestStatus;
  scheduledDate: string;
  recommendationReason?: string;
  activityId?: string | null;
  completedAt?: ContractDateTime;
  skippedAt?: ContractDateTime;
  createdAt: ContractDateTime;
  updatedAt: ContractDateTime;
}

export interface QuestDraft {
  title: string;
  description?: string;
  category: QuestCategory;
  customCategoryLabel?: string;
  rewardCategory?: ActivityCategory | null;
  estimatedMinutes: number;
  difficulty: QuestDifficulty;
  source: QuestSource;
  scheduledDate: string;
  recommendationReason?: string;
}
