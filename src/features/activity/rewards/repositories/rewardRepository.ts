import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import type {
  CategoryRewardProgress,
  DailyRewardContext,
  RewardTransaction,
} from '@/features/activity/rewards/types/reward';

function rewardContextRef(userId: string, dateKey: string) {
  return doc(firestore, 'users', userId, 'dailyRewardContexts', dateKey);
}

function rewardTransactionRef(userId: string, rewardId: string) {
  return doc(firestore, 'users', userId, 'rewardTransactions', rewardId);
}

function categoryProgressRef(userId: string, categoryId: string) {
  return doc(firestore, 'users', userId, 'categoryProgress', categoryId);
}

function profileRef(userId: string) {
  return doc(firestore, 'users', userId);
}

export async function loadDailyRewardContext(userId: string, dateKey: string) {
  const snapshot = await getDoc(rewardContextRef(userId, dateKey));
  return snapshot.exists()
    ? (snapshot.data() as DailyRewardContext)
    : {
      studyGrapesEarned: 0,
      cleaningXpRewardCount: 0,
      cleaningGrapeRewardCount: 0,
      showerXpRewardCount: 0,
      showerGrapeRewardCount: 0,
      waterRewardedCupCount: 0,
      waterGoalRewarded: false,
    };
}

export async function saveDailyRewardContext(
  userId: string,
  dateKey: string,
  context: DailyRewardContext,
) {
  await setDoc(rewardContextRef(userId, dateKey), {
    ...context,
    dateKey,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function loadCategoryRewardProgress(userId: string, categoryId: string) {
  const snapshot = await getDoc(categoryProgressRef(userId, categoryId));
  return snapshot.exists()
    ? (snapshot.data() as CategoryRewardProgress)
    : {
      categoryId: categoryId as CategoryRewardProgress['categoryId'],
      xp: 0,
      level: 1,
      completionCount: 0,
      totalGrapes: 0,
      lastRewardedAt: null,
      createdAt: null,
      updatedAt: null,
    };
}

export async function saveCategoryRewardProgress(
  userId: string,
  categoryId: string,
  progress: Omit<CategoryRewardProgress, 'createdAt' | 'updatedAt'>,
) {
  await setDoc(categoryProgressRef(userId, categoryId), {
    ...progress,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function recordRewardTransaction(transaction: RewardTransaction) {
  await setDoc(rewardTransactionRef(transaction.userId, transaction.rewardId), {
    ...transaction,
    createdAt: serverTimestamp(),
  });
}

export { categoryProgressRef, profileRef, rewardContextRef, rewardTransactionRef };
