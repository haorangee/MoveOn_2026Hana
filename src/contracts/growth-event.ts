export type GrowthEventType =
  | 'studyCompleted'
  | 'bookCreated'
  | 'milestoneReached'
  | 'roomCleaned'
  | 'showerCompleted'
  | 'plantGrown';

export type GrowthEvent = {
  id: string;
  type: GrowthEventType;
  occurredAt: string;
  metadata: Record<string, unknown>;
};
