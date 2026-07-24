import { collection, doc, getDocs } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import type { AchievementRecord } from '@/features/achievements/types/achievement';

function achievementRef(userId: string, achievementId: string) {
  return doc(firestore, 'users', userId, 'achievements', achievementId);
}

function achievementRewardTransactionRef(userId: string, achievementId: string) {
  return doc(firestore, 'users', userId, 'achievementRewardTransactions', achievementId);
}

export async function loadAchievementRecords(userId: string) {
  const snapshot = await getDocs(collection(firestore, 'users', userId, 'achievements'));
  return snapshot.docs.map((item) => item.data() as AchievementRecord);
}

export {
  achievementRef,
  achievementRewardTransactionRef,
};
