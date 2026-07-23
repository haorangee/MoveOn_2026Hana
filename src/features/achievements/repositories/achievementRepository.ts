import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import type { AchievementProgress } from '@/features/achievements/types/achievement';

function achievementRef(userId: string, achievementId: string) {
  return doc(firestore, 'users', userId, 'achievements', achievementId);
}

export async function loadAchievementProgress(userId: string) {
  const snapshot = await getDocs(collection(firestore, 'users', userId, 'achievements'));
  return snapshot.docs.map((item) => item.data() as AchievementProgress);
}

export async function saveAchievementProgress(userId: string, progress: AchievementProgress) {
  await setDoc(achievementRef(userId, progress.achievementId), {
    ...progress,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveAchievementProgressList(userId: string, progressList: AchievementProgress[]) {
  await Promise.all(progressList.map((progress) => saveAchievementProgress(userId, progress)));
}
