import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firestore, storage } from '@/config/firebase';

export type CleaningRecordStatus = 'in_progress' | 'completed';

export type CleaningRecord = {
  cleaningSessionId: string;
  userId: string;
  beforeImageUrl: string;
  afterImageUrl: string | null;
  startedAt: unknown;
  completedAt: unknown | null;
  status: CleaningRecordStatus;
};

function cleaningSessionRef(userId: string, cleaningSessionId: string) {
  return doc(firestore, 'users', userId, 'cleaningSessions', cleaningSessionId);
}

async function uploadCleaningImage(userId: string, cleaningSessionId: string, stage: 'before' | 'after', uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const imageRef = ref(storage, `users/${userId}/cleaning/${cleaningSessionId}/${stage}.jpg`);
  await uploadBytes(imageRef, blob);
  return getDownloadURL(imageRef);
}

export async function createCleaningSession(userId: string, beforeImageUri: string) {
  const cleaningSessionId = doc(collection(firestore, 'users', userId, 'cleaningSessions')).id;
  const beforeImageUrl = await uploadCleaningImage(userId, cleaningSessionId, 'before', beforeImageUri);

  const record: CleaningRecord = {
    cleaningSessionId,
    userId,
    beforeImageUrl,
    afterImageUrl: null,
    startedAt: serverTimestamp(),
    completedAt: null,
    status: 'in_progress',
  };

  await setDoc(cleaningSessionRef(userId, cleaningSessionId), record);
  return record;
}

export async function completeCleaningSession(
  userId: string,
  cleaningSessionId: string,
  afterImageUri: string,
) {
  const afterImageUrl = await uploadCleaningImage(userId, cleaningSessionId, 'after', afterImageUri);

  await updateDoc(cleaningSessionRef(userId, cleaningSessionId), {
    afterImageUrl,
    completedAt: serverTimestamp(),
    status: 'completed',
  });

  return afterImageUrl;
}
