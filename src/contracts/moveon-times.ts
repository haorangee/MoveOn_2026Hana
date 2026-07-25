export interface DailyMoveOnSummary {
  dateKey: string;
  completedQuestCount: number;
  studyMinutes: number;
  cleaningCount: number;
  showerCount: number;
  waterCupCount: number;
  waterAmountMl: number;
  earnedXp: number;
  earnedGrapes: number;
  unlockedAchievementTitles: string[];
  highlights: string[];
}

export type {
  MoveOnTimesArticle,
  MoveOnTimesIssue,
} from './ai-content';
