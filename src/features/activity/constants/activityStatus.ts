export const ACTIVITY_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ActivityStatus =
  (typeof ACTIVITY_STATUS)[keyof typeof ACTIVITY_STATUS];
