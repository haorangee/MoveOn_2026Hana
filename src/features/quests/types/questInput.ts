import type {
  Quest,
  QuestCategory,
  QuestDifficulty,
  QuestSource,
} from '../../../contracts/quest';
import type { AIQuestExecutionType, AIQuestLevel } from '../../../contracts/ai-quest';
import type { ActivityCategory } from '../../activity/constants/activityCategory';

export interface CreateQuestInput {
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
  executionType?: AIQuestExecutionType;
  aiQuestLevel?: AIQuestLevel;
}

export interface UpdateQuestInput {
  title?: string;
  description?: string | null;
  category?: QuestCategory;
  customCategoryLabel?: string | null;
  rewardCategory?: ActivityCategory | null;
  estimatedMinutes?: number;
  difficulty?: QuestDifficulty;
  scheduledDate?: string;
  recommendationReason?: string | null;
  executionType?: AIQuestExecutionType | null;
  aiQuestLevel?: AIQuestLevel | null;
}

export interface CompleteQuestInput {
  activityId?: string | null;
}

export interface QuestMutationResult {
  quest: Quest;
  alreadyProcessed: boolean;
}
