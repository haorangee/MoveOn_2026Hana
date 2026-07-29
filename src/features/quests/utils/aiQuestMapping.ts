import { ACTIVITY_CATEGORY, type ActivityCategory } from '@/features/activity/constants/activityCategory';
import type {
  AIQuestCategory,
  AIQuestLevel,
  AIQuestOption,
} from '@/contracts/ai-quest';
import type { QuestCategory, QuestDifficulty, QuestDraft } from '@/contracts/quest';
import { createDateKey } from '@/features/activity/utils/dateKey';

const DEFAULT_AI_QUEST_MINUTES = 10;
const ETC_CATEGORY_LABEL = '기타';

function mapCategory(category: AIQuestCategory): {
  category: QuestCategory;
  customCategoryLabel?: string;
  rewardCategory: ActivityCategory | null;
} {
  switch (category) {
    case ACTIVITY_CATEGORY.STUDY:
    case ACTIVITY_CATEGORY.CLEANING:
    case ACTIVITY_CATEGORY.SHOWER:
    case ACTIVITY_CATEGORY.WATER:
      return {
        category,
        rewardCategory: category,
      };
    case 'etc':
      return {
        category: 'custom',
        customCategoryLabel: ETC_CATEGORY_LABEL,
        rewardCategory: null,
      };
    default:
      return {
        category: 'custom',
        customCategoryLabel: ETC_CATEGORY_LABEL,
        rewardCategory: null,
      };
  }
}

function mapLevelToDifficulty(level: AIQuestLevel): QuestDifficulty {
  if (level === 'action') return 'normal';
  return 'easy';
}

function normalizeEstimatedMinutes(durationMinutes?: number) {
  if (
    typeof durationMinutes !== 'number'
    || !Number.isFinite(durationMinutes)
    || Number.isNaN(durationMinutes)
  ) {
    return DEFAULT_AI_QUEST_MINUTES;
  }

  return Math.min(1440, Math.max(1, Math.floor(durationMinutes)));
}

export function mapAIQuestOptionToQuestDraft(option: AIQuestOption): QuestDraft {
  const categoryMapping = mapCategory(option.category);

  return {
    title: option.title,
    ...categoryMapping,
    estimatedMinutes: normalizeEstimatedMinutes(option.durationMinutes),
    difficulty: mapLevelToDifficulty(option.level),
    source: 'ai',
    scheduledDate: createDateKey(),
    executionType: option.executionType,
    aiQuestLevel: option.level,
  };
}
