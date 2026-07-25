import type { QuestDraft } from './quest';

export type AiRequestType =
  | 'QUEST_RECOMMENDATION'
  | 'PET_MESSAGE'
  | 'COMPLETION_PRAISE'
  | 'MOVEON_TIMES';

export type AiContentSource = 'ai' | 'fallback';

export interface AiGenerationResult<T> {
  data: T;
  source: AiContentSource;
  generatedAt: string;
  requestId?: string;
}

export interface AiFallbackMessages {
  petMessage: string;
  completionPraise: string;
  questRecommendation: string;
  moveOnTimes: string;
}

export type AiQuestRecommendation = QuestDraft & {
  source: AiContentSource;
};

export type QuestType = 'study' | 'recovery' | 'water' | 'clean';

export type PersonalizedQuest = {
  id: string;
  type: QuestType;
  title: string;
  reason: string;
  targetMinutes: number;
  completed: boolean;
  rewardExperience: number;
  rewardCoin: number;
};

export type DailyQuestSet = {
  date: string;
  generatedAt: string;
  source: AiContentSource;
  quests: PersonalizedQuest[];
};

export type MoveOnTimesArticle = {
  section: string;
  headline: string;
  quote: string;
  body: string;
};

export type MoveOnTimesIssue = {
  issueId: string;
  issueDate: string;
  volume: number;
  title: string;
  tagline: string;
  editorComment: string;
  generatedAt: string;
  source: AiContentSource;
  leadArticle: MoveOnTimesArticle;
  articles: MoveOnTimesArticle[];
};

export type StudySessionRecord = {
  startedAt: string;
  endedAt: string;
  elapsedSeconds: number;
  targetDurationSeconds: number;
  categoryId: string;
  categoryLabel: string;
  completedPages: number;
};
