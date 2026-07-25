import type { ContractDateTime, QuestCategory } from './quest';

export type MotivationTone =
  | 'warm'
  | 'firm'
  | 'friendly'
  | 'playful';

export type DifficultTimeSlot =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'lateNight'
  | 'varies';

export interface PersonalizationProfile {
  habitGoals: string[];
  preferredCategories: QuestCategory[];
  preferredQuestDurationMinutes: number;
  preferredQuestCountPerDay: number;
  difficultTimes: DifficultTimeSlot[];
  preferredTone: MotivationTone;
  avoidedActivities: string[];
  customGoalText: string;
  updatedAt: ContractDateTime;
}
