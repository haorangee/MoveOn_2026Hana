export type LevelThreshold = {
  level: number;
  requiredXp: number;
};

export const TOTAL_LEVEL_THRESHOLDS: readonly LevelThreshold[] = [
  { level: 1, requiredXp: 0 },
  { level: 2, requiredXp: 50 },
  { level: 3, requiredXp: 150 },
  { level: 4, requiredXp: 300 },
  { level: 5, requiredXp: 500 },
  { level: 6, requiredXp: 800 },
  { level: 7, requiredXp: 1200 },
  { level: 8, requiredXp: 1700 },
  { level: 9, requiredXp: 2300 },
  { level: 10, requiredXp: 3000 },
] as const;

export const CATEGORY_LEVEL_THRESHOLDS: readonly LevelThreshold[] = [
  { level: 1, requiredXp: 0 },
  { level: 2, requiredXp: 50 },
  { level: 3, requiredXp: 150 },
  { level: 4, requiredXp: 400 },
  { level: 5, requiredXp: 1000 },
] as const;

