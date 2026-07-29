import type { Timestamp } from 'firebase/firestore';
import type { AIQuestExecutionType, AIQuestLevel } from '@/contracts/ai-quest';
import type { ActivityCategory } from '@/features/activity/constants/activityCategory';
import type { ActivityStatus } from '@/features/activity/constants/activityStatus';

export type ActivityRecordCategory = ActivityCategory | 'custom';

export type StudyActivityDetails = {
  subject?: string | null;
  goal?: string | null;
  plannedMinutes?: number | null;
  actualMinutes?: number | null;
  bookId?: string | null;
};

export type CleaningActivityDetails = {
  cleaningArea?: string | null;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  beforeImagePath?: string | null;
  afterImagePath?: string | null;
  aiScore?: number | null;
  aiAnalysisStatus?: 'not_requested' | 'pending' | 'completed' | 'failed';
};

export type ShowerActivityDetails = {
  showerType?: 'normal' | 'quick';
  selectedMinutes?: number | null;
  actualSeconds?: number | null;
  actualMinutes?: number | null;
  targetMet?: boolean | null;
  memo?: string | null;
};

export type WaterActivityDetails = {
  amountMl?: number;
  cupCount?: number;
};

export type QuestActivityDetails = {
  type: 'quest';
  questId: string;
  title: string;
  executionType: Extract<AIQuestExecutionType, 'simple' | 'my_time'>;
  aiQuestLevel?: AIQuestLevel;
  durationMinutes?: number;
};

export type ActivityDetails =
  | StudyActivityDetails
  | CleaningActivityDetails
  | ShowerActivityDetails
  | WaterActivityDetails
  | QuestActivityDetails;

export type ActivityRecord = {
  activityId: string;
  userId: string;
  categoryId: ActivityRecordCategory;
  rewardCategory?: ActivityCategory | null;
  status: ActivityStatus;
  dateKey: string;
  startedAt: Timestamp | Date | string | null;
  completedAt: Timestamp | Date | string | null;
  durationMinutes: number;
  createdAt: Timestamp | Date | string | null;
  updatedAt: Timestamp | Date | string | null;
  source: 'app' | 'widget';
  details: ActivityDetails;
  dailySummaryProcessed: boolean;
  rewardProcessed: boolean;
  rewardProcessedAt?: Timestamp | Date | string | null;
};

export type DailyActivitySummary = {
  dateKey: string;
  studyMinutes: number;
  studySessionCount: number;
  cleaningCompletedCount: number;
  showerCompletedCount: number;
  waterCupCount: number;
  waterAmountMl: number;
  completedCategories: ActivityCategory[];
  createdAt: Timestamp | Date | string | null;
  updatedAt: Timestamp | Date | string | null;
};
