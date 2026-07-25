import type { LevelThreshold } from '@/features/activity/levels/constants/levelPolicy';

export interface LevelProgress {
  level: number;
  currentXp: number;
  currentLevelRequiredXp: number;
  nextLevelRequiredXp: number | null;
  xpIntoCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressRatio: number;
  isMaxLevel: boolean;
}

export interface LevelChange {
  previousLevel: number;
  newLevel: number;
  didLevelUp: boolean;
  levelsGained: number;
}

export interface LevelProgressInput {
  xp: number;
  thresholds: readonly LevelThreshold[];
}

