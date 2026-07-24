import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import { ACHIEVEMENT_DEFINITIONS } from '@/features/achievements/achievementDefinitions';
import {
  achievementRef,
  achievementRewardTransactionRef,
  loadAchievementRecords,
} from '@/features/achievements/repositories/achievementRepository';
import type {
  AchievementDefinition,
  AchievementProgress,
  AchievementRecord,
  AchievementSummary,
  AchievementUnlockResult,
  ProcessAchievementResult,
} from '@/features/achievements/types/achievement';
import { calculateCategoryLevelProgress } from '@/features/activity/levels';

type AchievementSnapshot = {
  totalXp: number;
  grapes: number;
  studyHours: number;
  maxCategoryLevel: number;
  maxCategoryCompletions: number;
};

type AchievementTrigger = {
  triggerActivityId: string | null;
  triggerDateKey: string | null;
};

const EMPTY_ACHIEVEMENT_RESULT: ProcessAchievementResult = {
  unlockedAchievements: [],
  achievementGrapesEarned: 0,
};

function normalizeNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === 'number' ? value : Number(value ?? fallback);
  if (!Number.isFinite(numberValue) || Number.isNaN(numberValue)) return fallback;
  return Math.max(0, Math.floor(numberValue));
}

function createProgressText(value: number, target: number, suffix = '') {
  return `${Math.min(value, target)}/${target}${suffix}`;
}

async function loadAchievementSnapshot(userId: string): Promise<AchievementSnapshot> {
  const [profileSnap, dailySummarySnap, categoryProgressSnap] = await Promise.all([
    getDoc(doc(firestore, 'users', userId)),
    getDocs(collection(firestore, 'users', userId, 'dailyActivitySummaries')),
    getDocs(collection(firestore, 'users', userId, 'categoryProgress')),
  ]);

  const profile = profileSnap.exists()
    ? (profileSnap.data() as { grapes?: number; totalXp?: number })
    : null;

  let studyMinutes = 0;
  dailySummarySnap.forEach((snapshot) => {
    const data = snapshot.data() as { studyMinutes?: number };
    studyMinutes += normalizeNumber(data.studyMinutes);
  });

  let maxCategoryLevel = 1;
  let maxCategoryCompletions = 0;
  categoryProgressSnap.forEach((snapshot) => {
    const data = snapshot.data() as { completionCount?: number; level?: number; xp?: number };
    const xp = normalizeNumber(data.xp);
    const level = typeof data.level === 'number'
      ? Math.max(1, Math.floor(data.level))
      : calculateCategoryLevelProgress(xp).level;

    maxCategoryLevel = Math.max(maxCategoryLevel, level);
    maxCategoryCompletions = Math.max(maxCategoryCompletions, normalizeNumber(data.completionCount));
  });

  return {
    totalXp: normalizeNumber(profile?.totalXp),
    grapes: normalizeNumber(profile?.grapes),
    studyHours: Math.floor(studyMinutes / 60),
    maxCategoryLevel,
    maxCategoryCompletions,
  };
}

function progressValueForDefinition(
  definition: AchievementDefinition,
  snapshot: AchievementSnapshot,
) {
  switch (definition.id) {
    case 'first_xp':
    case 'steady_growth':
      return snapshot.totalXp;
    case 'study_hours_10':
    case 'study_hours_50':
      return snapshot.studyHours;
    case 'category_master':
      return snapshot.maxCategoryLevel;
    case 'completion_streak':
      return snapshot.maxCategoryCompletions;
    case 'grape_collector':
      return snapshot.grapes;
  }
}

function progressTextForDefinition(
  definition: AchievementDefinition,
  progressValue: number,
) {
  switch (definition.id) {
    case 'first_xp':
    case 'steady_growth':
      return createProgressText(progressValue, definition.targetValue, ' XP');
    case 'study_hours_10':
    case 'study_hours_50':
      return createProgressText(progressValue, definition.targetValue, 'h');
    case 'category_master':
      return `Lv.${progressValue}/Lv.${definition.targetValue}`;
    case 'completion_streak':
      return createProgressText(progressValue, definition.targetValue, '회');
    case 'grape_collector':
      return createProgressText(progressValue, definition.targetValue);
  }
}

function buildAchievementProgress(
  definition: AchievementDefinition,
  snapshot: AchievementSnapshot,
  record?: AchievementRecord,
): AchievementProgress {
  const progressValue = progressValueForDefinition(definition, snapshot);
  return {
    achievementId: definition.id,
    status: record ? 'earned' : 'locked',
    progressValue: record ? normalizeNumber(record.progressValue, progressValue) : progressValue,
    targetValue: definition.targetValue,
    progressText: progressTextForDefinition(definition, progressValue),
    earnedAt: record?.earnedAt ?? null,
  };
}

function buildAchievementRecord(
  definition: AchievementDefinition,
  trigger: AchievementTrigger,
  progressValue: number,
): AchievementRecord {
  const timestamp = serverTimestamp();
  return {
    achievementId: definition.id,
    category: definition.category,
    title: definition.title,
    rewardGrapes: definition.rewardGrapes,
    earnedAt: timestamp,
    triggerActivityId: trigger.triggerActivityId,
    triggerDateKey: trigger.triggerDateKey,
    progressValue,
    targetValue: definition.targetValue,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function unlockAchievementIfNeeded(
  userId: string,
  definition: AchievementDefinition,
  trigger: AchievementTrigger,
  progressValue: number,
): Promise<AchievementUnlockResult | null> {
  const userRef = doc(firestore, 'users', userId);
  const userAchievementRef = achievementRef(userId, definition.id);
  const rewardTransactionRef = achievementRewardTransactionRef(userId, definition.id);

  return runTransaction(firestore, async (transaction) => {
    const [achievementSnap, rewardTransactionSnap] = await Promise.all([
      transaction.get(userAchievementRef),
      transaction.get(rewardTransactionRef),
    ]);

    if (achievementSnap.exists()) {
      return null;
    }

    const achievementRecord = buildAchievementRecord(definition, trigger, progressValue);

    if (rewardTransactionSnap.exists()) {
      transaction.set(userAchievementRef, {
        ...achievementRecord,
        earnedAt: rewardTransactionSnap.data().createdAt ?? achievementRecord.earnedAt,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return null;
    }

    transaction.set(userAchievementRef, achievementRecord);
    transaction.set(rewardTransactionRef, {
      achievementId: definition.id,
      userId,
      earnedGrapes: definition.rewardGrapes,
      createdAt: serverTimestamp(),
    });

    if (definition.rewardGrapes > 0) {
      transaction.set(userRef, {
        grapes: increment(definition.rewardGrapes),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    return {
      achievementId: definition.id,
      title: definition.title,
      rewardGrapes: definition.rewardGrapes,
    };
  });
}

export async function processAchievementUnlocks(
  userId: string,
  trigger: AchievementTrigger,
): Promise<ProcessAchievementResult> {
  const snapshot = await loadAchievementSnapshot(userId);
  const unlockedAchievements: AchievementUnlockResult[] = [];

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const progressValue = progressValueForDefinition(definition, snapshot);
    if (progressValue < definition.targetValue) continue;

    try {
      const unlockResult = await unlockAchievementIfNeeded(userId, definition, trigger, progressValue);
      if (unlockResult) unlockedAchievements.push(unlockResult);
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('Failed to unlock achievement.', definition.id, error);
      }
    }
  }

  return {
    unlockedAchievements,
    achievementGrapesEarned: unlockedAchievements.reduce(
      (total, achievement) => total + achievement.rewardGrapes,
      0,
    ),
  };
}

export async function loadAchievementSummaries(userId: string): Promise<AchievementSummary[]> {
  const [snapshot, records] = await Promise.all([
    loadAchievementSnapshot(userId),
    loadAchievementRecords(userId),
  ]);
  const recordLookup = new Map(records.map((record) => [record.achievementId, record]));

  return ACHIEVEMENT_DEFINITIONS
    .map((definition) => ({
      ...definition,
      ...buildAchievementProgress(definition, snapshot, recordLookup.get(definition.id)),
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function emptyAchievementResult(): ProcessAchievementResult {
  return EMPTY_ACHIEVEMENT_RESULT;
}
