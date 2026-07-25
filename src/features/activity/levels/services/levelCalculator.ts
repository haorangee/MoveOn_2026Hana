import { CATEGORY_LEVEL_THRESHOLDS, TOTAL_LEVEL_THRESHOLDS, type LevelThreshold } from '@/features/activity/levels/constants/levelPolicy';
import type { LevelChange, LevelProgress } from '@/features/activity/levels/types/level';

function normalizeXp(value: number) {
  if (!Number.isFinite(value) || Number.isNaN(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function findLevel(xp: number, thresholds: readonly LevelThreshold[]) {
  const normalizedXp = normalizeXp(xp);
  const sorted = [...thresholds].sort((left, right) => left.requiredXp - right.requiredXp);

  let current = sorted[0] ?? { level: 1, requiredXp: 0 };
  for (const threshold of sorted) {
    if (normalizedXp >= threshold.requiredXp) {
      current = threshold;
    } else {
      break;
    }
  }

  const currentIndex = sorted.findIndex((threshold) => threshold.level === current.level);
  const next = currentIndex >= 0 ? sorted[currentIndex + 1] ?? null : null;
  const xpIntoCurrentLevel = normalizedXp - current.requiredXp;
  const xpNeededForNextLevel = next ? Math.max(0, next.requiredXp - normalizedXp) : 0;
  const progressRatio = next
    ? Math.min(1, Math.max(0, xpIntoCurrentLevel / Math.max(1, next.requiredXp - current.requiredXp)))
    : 1;

  return {
    level: current.level,
    currentXp: normalizedXp,
    currentLevelRequiredXp: current.requiredXp,
    nextLevelRequiredXp: next?.requiredXp ?? null,
    xpIntoCurrentLevel,
    xpNeededForNextLevel,
    progressRatio,
    isMaxLevel: next === null,
  } satisfies LevelProgress;
}

export function calculateLevelProgress(
  xp: number,
  thresholds: readonly LevelThreshold[],
): LevelProgress {
  return findLevel(xp, thresholds);
}

export function calculateTotalLevelProgress(totalXp: number) {
  return calculateLevelProgress(totalXp, TOTAL_LEVEL_THRESHOLDS);
}

export function calculateCategoryLevelProgress(categoryXp: number) {
  return calculateLevelProgress(categoryXp, CATEGORY_LEVEL_THRESHOLDS);
}

export function calculateLevelChange(
  previousXp: number,
  newXp: number,
  thresholds: readonly LevelThreshold[],
): LevelChange {
  const previousLevel = calculateLevelProgress(previousXp, thresholds).level;
  const newLevel = calculateLevelProgress(newXp, thresholds).level;
  return {
    previousLevel,
    newLevel,
    didLevelUp: newLevel > previousLevel,
    levelsGained: Math.max(0, newLevel - previousLevel),
  };
}

