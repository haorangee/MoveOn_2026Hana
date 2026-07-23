export const ACTIVITY_CATEGORY = {
  STUDY: 'study',
  CLEANING: 'cleaning',
  SHOWER: 'shower',
  WATER: 'water',
} as const;

export type ActivityCategory =
  (typeof ACTIVITY_CATEGORY)[keyof typeof ACTIVITY_CATEGORY];
