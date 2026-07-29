import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import type {
  ActivityRecord,
  DailyActivitySummary,
} from '@/features/activity/types/activity';
import type { ActivityCategory } from '@/features/activity/constants/activityCategory';

function activityRecordRef(userId: string, activityId: string) {
  return doc(firestore, 'users', userId, 'activityRecords', activityId);
}

function dailySummaryRef(userId: string, dateKey: string) {
  return doc(firestore, 'users', userId, 'dailyActivitySummaries', dateKey);
}

export async function createActivityRecord(record: ActivityRecord) {
  await setDoc(activityRecordRef(record.userId, record.activityId), {
    ...record,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createActivityRecordIfMissing(record: ActivityRecord) {
  const reference = activityRecordRef(record.userId, record.activityId);
  return runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (snapshot.exists()) {
      return snapshot.data() as ActivityRecord;
    }

    const nextRecord = {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    transaction.set(reference, nextRecord);
    return record;
  });
}

export async function updateActivityRecord(
  userId: string,
  activityId: string,
  patch: Partial<ActivityRecord>,
) {
  await setDoc(activityRecordRef(userId, activityId), {
    ...patch,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getActivityRecord(userId: string, activityId: string) {
  const snapshot = await getDoc(activityRecordRef(userId, activityId));
  return snapshot.exists() ? (snapshot.data() as ActivityRecord) : null;
}

export async function updateDailySummary(
  userId: string,
  dateKey: string,
  updater: (current: DailyActivitySummary) => DailyActivitySummary,
) {
  await runTransaction(firestore, async (transaction) => {
    const reference = dailySummaryRef(userId, dateKey);
    const snapshot = await transaction.get(reference);
    const current = snapshot.exists()
      ? (snapshot.data() as DailyActivitySummary)
      : {
        dateKey,
        studyMinutes: 0,
        studySessionCount: 0,
        cleaningCompletedCount: 0,
        showerCompletedCount: 0,
        waterCupCount: 0,
        waterAmountMl: 0,
        completedCategories: [],
        createdAt: null,
        updatedAt: null,
      };
    const next = updater(current);

    transaction.set(reference, {
      ...next,
      createdAt: snapshot.exists() ? current.createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

export function watchActivityRecords(
  userId: string,
  onChange: (records: ActivityRecord[]) => void,
) {
  return onSnapshot(
    query(
      collection(firestore, 'users', userId, 'activityRecords'),
      orderBy('updatedAt', 'desc'),
    ),
    (snapshot) => {
      onChange(snapshot.docs.map((item) => item.data() as ActivityRecord));
    },
  );
}

export function buildCompletedCategories(
  categories: ActivityCategory[],
) {
  return Array.from(new Set(categories));
}
