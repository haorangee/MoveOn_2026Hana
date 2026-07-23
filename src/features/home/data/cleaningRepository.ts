import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firestore, storage } from '@/config/firebase';
import { ACTIVITY_CATEGORY } from '@/features/activity/constants/activityCategory';
import { ACTIVITY_STATUS } from '@/features/activity/constants/activityStatus';
import { processActivityReward } from '@/features/activity/rewards/services/rewardService';
import type { ProcessActivityRewardResult } from '@/features/activity/rewards/types/reward';
import { getActivityRecord } from '@/features/activity/repositories/activityRepository';
import { createDateKey } from '@/features/activity/utils/dateKey';

export type CleaningRecordStatus = 'in_progress' | 'completed';

export type CleaningRecord = {
  activityId: string;
  cleaningSessionId: string;
  userId: string;
  beforeImageUrl: string;
  afterImageUrl: string | null;
  startedAt: unknown;
  completedAt: unknown | null;
  status: CleaningRecordStatus;
};

function activityRecordRef(userId: string, activityId: string) {
  return doc(firestore, 'users', userId, 'activityRecords', activityId);
}

async function uploadCleaningImage(
  userId: string,
  activityId: string,
  stage: 'before' | 'after',
  uri: string,
) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const imageRef = ref(storage, `users/${userId}/cleaning/${activityId}/${stage}.jpg`);
  await uploadBytes(imageRef, blob);
  return getDownloadURL(imageRef);
}

export async function createCleaningSession(userId: string, beforeImageUri: string) {
  const activityId = doc(collection(firestore, 'users', userId, 'activityRecords')).id;
  const beforeImageUrl = await uploadCleaningImage(userId, activityId, 'before', beforeImageUri);
  const dateKey = createDateKey();

  const record: CleaningRecord = {
    activityId,
    cleaningSessionId: activityId,
    userId,
    beforeImageUrl,
    afterImageUrl: null,
    startedAt: serverTimestamp(),
    completedAt: null,
    status: ACTIVITY_STATUS.IN_PROGRESS,
  };

  await setDoc(activityRecordRef(userId, activityId), {
    activityId,
    userId,
    categoryId: ACTIVITY_CATEGORY.CLEANING,
    status: ACTIVITY_STATUS.IN_PROGRESS,
    dateKey,
    startedAt: serverTimestamp(),
    completedAt: null,
    durationMinutes: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    source: 'app',
    rewardProcessed: false,
    details: {
      cleaningArea: null,
      beforeImageUrl,
      afterImageUrl: null,
      beforeImagePath: `users/${userId}/cleaning/${activityId}/before.jpg`,
      afterImagePath: null,
      aiScore: null,
      aiAnalysisStatus: 'not_requested',
    },
    dailySummaryProcessed: false,
  });

  return record;
}

export async function completeCleaningSession(
  userId: string,
  activityId: string,
  afterImageUri: string,
): Promise<{ afterImageUrl: string; rewardResult: ProcessActivityRewardResult | null }> {
  const afterImageUrl = await uploadCleaningImage(userId, activityId, 'after', afterImageUri);

  await updateDoc(activityRecordRef(userId, activityId), {
    status: ACTIVITY_STATUS.COMPLETED,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    details: {
      afterImageUrl,
      afterImagePath: `users/${userId}/cleaning/${activityId}/after.jpg`,
      aiAnalysisStatus: 'not_requested',
    },
  });

  const updated = await getActivityRecord(userId, activityId);
  const rewardResult = updated ? await processActivityReward(updated) : null;
  return { afterImageUrl, rewardResult };
}
