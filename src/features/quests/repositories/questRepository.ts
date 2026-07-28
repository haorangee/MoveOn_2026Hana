import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import {
  ACTIVITY_CATEGORY,
  type ActivityCategory,
} from '../../activity/constants/activityCategory';
import type {
  ContractDateTime,
  Quest,
  QuestCategory,
  QuestDifficulty,
  QuestSource,
  QuestStatus,
} from '../../../contracts/quest';
import type { AIQuestExecutionType, AIQuestLevel } from '../../../contracts/ai-quest';
import type {
  CreateQuestInput,
  UpdateQuestInput,
} from '../types/questInput';

const QUEST_STATUS_VALUES = ['pending', 'completed', 'skipped'] as const;
const QUEST_DIFFICULTY_VALUES = ['easy', 'normal', 'hard'] as const;
const QUEST_SOURCE_VALUES = ['system', 'user', 'ai', 'fallback'] as const;
const AI_QUEST_EXECUTION_TYPE_VALUES = ['simple', 'study', 'cleaning', 'shower', 'water', 'my_time'] as const;
const AI_QUEST_LEVEL_VALUES = ['very_easy', 'easy', 'action'] as const;

function questCollectionRef(userId: string) {
  return collection(firestore, 'users', userId, 'quests');
}

export function questDocumentRef(userId: string, questId: string) {
  return doc(firestore, 'users', userId, 'quests', questId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isActivityCategory(value: unknown): value is ActivityCategory {
  return Object.values(ACTIVITY_CATEGORY).includes(value as ActivityCategory);
}

function isQuestCategory(value: unknown): value is QuestCategory {
  return value === 'custom' || isActivityCategory(value);
}

function isQuestStatus(value: unknown): value is QuestStatus {
  return QUEST_STATUS_VALUES.includes(value as QuestStatus);
}

function isQuestDifficulty(value: unknown): value is QuestDifficulty {
  return QUEST_DIFFICULTY_VALUES.includes(value as QuestDifficulty);
}

function isQuestSource(value: unknown): value is QuestSource {
  return QUEST_SOURCE_VALUES.includes(value as QuestSource);
}

function isAIQuestExecutionType(value: unknown): value is AIQuestExecutionType {
  return AI_QUEST_EXECUTION_TYPE_VALUES.includes(value as AIQuestExecutionType);
}

function isAIQuestLevel(value: unknown): value is AIQuestLevel {
  return AI_QUEST_LEVEL_VALUES.includes(value as AIQuestLevel);
}

function normalizeOptionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeMinutes(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value ?? 10);
  if (!Number.isFinite(numberValue) || Number.isNaN(numberValue)) return 10;
  return Math.min(1440, Math.max(1, Math.floor(numberValue)));
}

function normalizeScheduledDate(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : '1970-01-01';
}

function normalizeDateTime(value: unknown): ContractDateTime {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || value instanceof Date) return value;
  if (isRecord(value) && typeof value.toDate === 'function') {
    return value as ContractDateTime;
  }
  return null;
}

function dateTimeToMillis(value: ContractDateTime) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  try {
    return value.toDate().getTime();
  } catch {
    return 0;
  }
}

function sortQuestList(quests: Quest[]) {
  return [...quests].sort((left, right) => {
    const createdAtDiff = dateTimeToMillis(left.createdAt) - dateTimeToMillis(right.createdAt);
    if (createdAtDiff !== 0) return createdAtDiff;
    return left.title.localeCompare(right.title, 'ko');
  });
}

function fallbackQuest(
  id: string,
  input: CreateQuestInput,
): Quest {
  const now = new Date();
  return {
    id,
    title: input.title,
    ...(input.description ? { description: input.description } : {}),
    category: input.category,
    ...(input.customCategoryLabel ? { customCategoryLabel: input.customCategoryLabel } : {}),
    rewardCategory: input.rewardCategory ?? null,
    estimatedMinutes: input.estimatedMinutes,
    difficulty: input.difficulty,
    source: input.source,
    status: 'pending',
    scheduledDate: input.scheduledDate,
    ...(input.recommendationReason ? { recommendationReason: input.recommendationReason } : {}),
    ...(input.executionType ? { executionType: input.executionType } : {}),
    ...(input.aiQuestLevel ? { aiQuestLevel: input.aiQuestLevel } : {}),
    activityId: null,
    completedAt: null,
    skippedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function buildCreateData(
  reference: DocumentReference<DocumentData>,
  input: CreateQuestInput,
) {
  return {
    id: reference.id,
    title: input.title,
    description: input.description ?? null,
    category: input.category,
    customCategoryLabel: input.customCategoryLabel ?? null,
    rewardCategory: input.rewardCategory ?? null,
    estimatedMinutes: input.estimatedMinutes,
    difficulty: input.difficulty,
    source: input.source,
    status: 'pending',
    scheduledDate: input.scheduledDate,
    recommendationReason: input.recommendationReason ?? null,
    executionType: input.executionType ?? null,
    aiQuestLevel: input.aiQuestLevel ?? null,
    activityId: null,
    completedAt: null,
    skippedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildUpdateData(input: UpdateQuestInput) {
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  return updateData;
}

export function mapQuestSnapshot(
  snapshot: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>,
): Quest {
  const data = snapshot.data() ?? {};
  const title = normalizeOptionalText(data.title) ?? '제목 없는 퀘스트';
  const category = isQuestCategory(data.category) ? data.category : 'custom';
  const description = normalizeOptionalText(data.description);
  const customCategoryLabel = normalizeOptionalText(data.customCategoryLabel);
  const recommendationReason = normalizeOptionalText(data.recommendationReason);
  const rewardCategory = isActivityCategory(data.rewardCategory) ? data.rewardCategory : null;
  const executionType = isAIQuestExecutionType(data.executionType) ? data.executionType : undefined;
  const aiQuestLevel = isAIQuestLevel(data.aiQuestLevel) ? data.aiQuestLevel : undefined;
  const activityId = normalizeOptionalText(data.activityId) ?? null;

  return {
    id: snapshot.id,
    title,
    ...(description ? { description } : {}),
    category,
    ...(customCategoryLabel ? { customCategoryLabel } : {}),
    rewardCategory,
    estimatedMinutes: normalizeMinutes(data.estimatedMinutes),
    difficulty: isQuestDifficulty(data.difficulty) ? data.difficulty : 'normal',
    source: isQuestSource(data.source) ? data.source : 'system',
    status: isQuestStatus(data.status) ? data.status : 'pending',
    scheduledDate: normalizeScheduledDate(data.scheduledDate),
    ...(recommendationReason ? { recommendationReason } : {}),
    ...(executionType ? { executionType } : {}),
    ...(aiQuestLevel ? { aiQuestLevel } : {}),
    activityId,
    completedAt: normalizeDateTime(data.completedAt),
    skippedAt: normalizeDateTime(data.skippedAt),
    createdAt: normalizeDateTime(data.createdAt),
    updatedAt: normalizeDateTime(data.updatedAt),
  };
}

export async function createQuest(
  userId: string,
  input: CreateQuestInput,
): Promise<Quest> {
  const reference = doc(questCollectionRef(userId));
  await setDoc(reference, buildCreateData(reference, input));

  const snapshot = await getDoc(reference);
  return snapshot.exists()
    ? mapQuestSnapshot(snapshot)
    : fallbackQuest(reference.id, input);
}

export async function getQuest(
  userId: string,
  questId: string,
): Promise<Quest | null> {
  const snapshot = await getDoc(questDocumentRef(userId, questId));
  return snapshot.exists() ? mapQuestSnapshot(snapshot) : null;
}

export async function getQuestsByDate(
  userId: string,
  scheduledDate: string,
): Promise<Quest[]> {
  const snapshot = await getDocs(query(
    questCollectionRef(userId),
    where('scheduledDate', '==', scheduledDate),
  ));

  return sortQuestList(snapshot.docs.map((item) => mapQuestSnapshot(item)));
}

export async function updateQuest(
  userId: string,
  questId: string,
  input: UpdateQuestInput,
): Promise<Quest> {
  const reference = questDocumentRef(userId, questId);
  await updateDoc(reference, buildUpdateData(input));

  const updated = await getDoc(reference);
  if (!updated.exists()) {
    throw new Error('Quest document was not found after update.');
  }

  return mapQuestSnapshot(updated);
}

export async function deleteQuest(
  userId: string,
  questId: string,
): Promise<void> {
  await deleteDoc(questDocumentRef(userId, questId));
}
