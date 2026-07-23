import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { ACHIEVEMENT_DEFINITIONS } from '@/features/achievements/achievementDefinitions';
import {
  loadAchievementProgress,
  saveAchievementProgressList,
} from '@/features/achievements/repositories/achievementRepository';
import { calculateCategoryLevelProgress } from '@/features/activity/levels';
import type { AchievementProgress, AchievementSummary } from '@/features/achievements/types/achievement';

type AchievementSnapshot = {
  totalXp: number;
  grapes: number;
  studyMinutes: number;
  maxCategoryLevel: number;
  maxCategoryCompletions: number;
};

function normalizeNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(numberValue) || Number.isNaN(numberValue)) return 0;
  return Math.max(0, Math.floor(numberValue));
}

async function loadSnapshot(userId: string): Promise<AchievementSnapshot> {
  const [profileSnap, summarySnap, categorySnap] = await Promise.all([
    getDoc(doc(firestore, 'users', userId)),
    getDocs(collection(firestore, 'users', userId, 'dailyActivitySummaries')),
    getDocs(collection(firestore, 'users', userId, 'categoryProgress')),
  ]);

  const profile = profileSnap.exists()
    ? (profileSnap.data() as { totalXp?: number; grapes?: number })
    : undefined;
  let studyMinutes = 0;
  summarySnap.forEach((snapshot) => {
    const data = snapshot.data() as { studyMinutes?: number };
    studyMinutes += normalizeNumber(data.studyMinutes);
  });

  let maxCategoryLevel = 1;
  let maxCategoryCompletions = 0;
  categorySnap.forEach((snapshot) => {
    const data = snapshot.data() as { xp?: number; level?: number; completionCount?: number };
    const xp = normalizeNumber(data.xp);
    const level = typeof data.level === 'number' ? data.level : calculateCategoryLevelProgress(xp).level;
    maxCategoryLevel = Math.max(maxCategoryLevel, level);
    maxCategoryCompletions = Math.max(maxCategoryCompletions, normalizeNumber(data.completionCount));
  });

  return {
    totalXp: normalizeNumber(profile?.totalXp),
    grapes: normalizeNumber(profile?.grapes),
    studyMinutes,
    maxCategoryLevel,
    maxCategoryCompletions,
  };
}

function buildProgress(
  userId: string,
  snapshot: AchievementSnapshot,
  definitions = ACHIEVEMENT_DEFINITIONS,
): AchievementProgress[] {
  const totalStudyHours = Math.floor(snapshot.studyMinutes / 60);
  const now = new Date().toISOString();

  return definitions.map((definition) => {
    let progressValue = 0;
    let targetValue = 1;
    let achieved = false;
    let progressText = '0/1';

    switch (definition.id) {
      case 'first_xp':
        progressValue = snapshot.totalXp;
        targetValue = 50;
        achieved = snapshot.totalXp >= targetValue;
        progressText = `${Math.min(progressValue, targetValue)}/${targetValue} XP`;
        break;
      case 'steady_growth':
        progressValue = snapshot.totalXp;
        targetValue = 300;
        achieved = snapshot.totalXp >= targetValue;
        progressText = `${Math.min(progressValue, targetValue)}/${targetValue} XP`;
        break;
      case 'study_hours_10':
        progressValue = totalStudyHours;
        targetValue = 10;
        achieved = totalStudyHours >= targetValue;
        progressText = `${Math.min(progressValue, targetValue)}/${targetValue}h`;
        break;
      case 'study_hours_50':
        progressValue = totalStudyHours;
        targetValue = 50;
        achieved = totalStudyHours >= targetValue;
        progressText = `${Math.min(progressValue, targetValue)}/${targetValue}h`;
        break;
      case 'category_master':
        progressValue = snapshot.maxCategoryLevel;
        targetValue = 3;
        achieved = snapshot.maxCategoryLevel >= targetValue;
        progressText = `Lv.${snapshot.maxCategoryLevel}/Lv.${targetValue}`;
        break;
      case 'completion_streak':
        progressValue = snapshot.maxCategoryCompletions;
        targetValue = 10;
        achieved = snapshot.maxCategoryCompletions >= targetValue;
        progressText = `${Math.min(progressValue, targetValue)}/${targetValue}회`;
        break;
      case 'grape_collector':
        progressValue = snapshot.grapes;
        targetValue = 100;
        achieved = snapshot.grapes >= targetValue;
        progressText = `${Math.min(progressValue, targetValue)}/${targetValue}`;
        break;
    }

    return {
      achievementId: definition.id,
      status: achieved ? 'earned' : 'locked',
      progressValue,
      targetValue,
      progressText,
      earnedAt: achieved ? now : null,
      updatedAt: now,
    };
  });
}

export async function syncUserAchievements(userId: string) {
  const snapshot = await loadSnapshot(userId);
  const progress = buildProgress(userId, snapshot);
  await saveAchievementProgressList(userId, progress);
  return progress;
}

export async function loadAchievementSummaries(userId: string): Promise<AchievementSummary[]> {
  const [progressList] = await Promise.all([
    loadAchievementProgress(userId),
    syncUserAchievements(userId),
  ]);

  const progressMap = new Map(progressList.map((item) => [item.achievementId, item]));
  return ACHIEVEMENT_DEFINITIONS
    .map((definition) => {
      const progress = progressMap.get(definition.id);
      return {
        ...definition,
        achievementId: definition.id,
        status: progress?.status ?? 'locked',
        progressValue: progress?.progressValue ?? 0,
        targetValue: progress?.targetValue ?? 1,
        progressText: progress?.progressText ?? '0/1',
        earnedAt: progress?.earnedAt ?? null,
        updatedAt: progress?.updatedAt ?? null,
      };
    })
    .sort((left, right) => left.sortOrder - right.sortOrder);
}
