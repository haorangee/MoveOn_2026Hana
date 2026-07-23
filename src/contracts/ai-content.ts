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
  source: 'ai' | 'fallback';
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
  source: 'ai' | 'fallback';
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
