import { runTransaction, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import {
  ACTIVITY_CATEGORY,
  type ActivityCategory,
} from '../../activity/constants/activityCategory';
import { createDateKey } from '../../activity/utils/dateKey';
import type {
  Quest,
  QuestCategory,
  QuestDifficulty,
  QuestDraft,
  QuestSource,
} from '../../../contracts/quest';
import type { AIQuestExecutionType, AIQuestLevel } from '../../../contracts/ai-quest';
import type {
  CompleteQuestInput,
  CreateQuestInput,
  QuestMutationResult,
  UpdateQuestInput,
} from '../types/questInput';
import {
  createQuest as createQuestRecord,
  deleteQuest as deleteQuestRecord,
  getQuest as getQuestRecord,
  getQuestsByDate as getQuestsByDateRecord,
  mapQuestSnapshot,
  questDocumentRef,
  updateQuest as updateQuestRecord,
} from '../repositories/questRepository';

export type QuestErrorCode =
  | 'QUEST_NOT_FOUND'
  | 'QUEST_INVALID_INPUT'
  | 'QUEST_ALREADY_COMPLETED'
  | 'QUEST_ALREADY_SKIPPED'
  | 'QUEST_INVALID_TRANSITION'
  | 'QUEST_COMPLETED_DELETE_FORBIDDEN';

export class QuestError extends Error {
  code: QuestErrorCode;

  constructor(code: QuestErrorCode, message: string) {
    super(message);
    this.name = 'QuestError';
    this.code = code;
  }
}

const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 500;
const RECOMMENDATION_REASON_MAX_LENGTH = 500;
const CUSTOM_CATEGORY_LABEL_MAX_LENGTH = 40;
const MIN_ESTIMATED_MINUTES = 1;
const MAX_ESTIMATED_MINUTES = 1440;
const QUEST_DIFFICULTIES: QuestDifficulty[] = ['easy', 'normal', 'hard'];
const QUEST_SOURCES: QuestSource[] = ['system', 'user', 'ai', 'fallback'];
const AI_QUEST_EXECUTION_TYPES: AIQuestExecutionType[] = ['simple', 'study', 'cleaning', 'shower', 'water', 'my_time'];
const AI_QUEST_LEVELS: AIQuestLevel[] = ['very_easy', 'easy', 'action'];

function throwQuestError(code: QuestErrorCode, message: string): never {
  throw new QuestError(code, message);
}

function isActivityCategory(value: unknown): value is ActivityCategory {
  return Object.values(ACTIVITY_CATEGORY).includes(value as ActivityCategory);
}

function isQuestCategory(value: unknown): value is QuestCategory {
  return value === 'custom' || isActivityCategory(value);
}

function normalizeRequiredText(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  if (typeof value !== 'string') {
    throwQuestError('QUEST_INVALID_INPUT', `${fieldName}은 문자열이어야 해요.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throwQuestError('QUEST_INVALID_INPUT', `${fieldName}을 입력해 주세요.`);
  }

  if (normalized.length > maxLength) {
    throwQuestError('QUEST_INVALID_INPUT', `${fieldName}은 ${maxLength}자 이하로 입력해 주세요.`);
  }

  return normalized;
}

function normalizeOptionalTextForCreate(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throwQuestError('QUEST_INVALID_INPUT', `${fieldName}은 문자열이어야 해요.`);
  }

  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > maxLength) {
    throwQuestError('QUEST_INVALID_INPUT', `${fieldName}은 ${maxLength}자 이하로 입력해 주세요.`);
  }

  return normalized;
}

function normalizeOptionalTextForUpdate(
  value: unknown,
  fieldName: string,
  maxLength: number,
) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throwQuestError('QUEST_INVALID_INPUT', `${fieldName}은 문자열이어야 해요.`);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throwQuestError('QUEST_INVALID_INPUT', `${fieldName}은 ${maxLength}자 이하로 입력해 주세요.`);
  }

  return normalized;
}

function normalizeQuestCategory(value: unknown) {
  if (!isQuestCategory(value)) {
    throwQuestError('QUEST_INVALID_INPUT', '지원하지 않는 퀘스트 카테고리예요.');
  }
  return value;
}

function normalizeDifficulty(value: unknown) {
  if (!QUEST_DIFFICULTIES.includes(value as QuestDifficulty)) {
    throwQuestError('QUEST_INVALID_INPUT', '지원하지 않는 퀘스트 난이도예요.');
  }
  return value as QuestDifficulty;
}

function normalizeSource(value: unknown) {
  if (!QUEST_SOURCES.includes(value as QuestSource)) {
    throwQuestError('QUEST_INVALID_INPUT', '지원하지 않는 퀘스트 출처예요.');
  }
  return value as QuestSource;
}

function normalizeExecutionType(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!AI_QUEST_EXECUTION_TYPES.includes(value as AIQuestExecutionType)) {
    throwQuestError('QUEST_INVALID_INPUT', '지원하지 않는 AI 실행 타입이에요.');
  }
  return value as AIQuestExecutionType;
}

function normalizeAIQuestLevel(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!AI_QUEST_LEVELS.includes(value as AIQuestLevel)) {
    throwQuestError('QUEST_INVALID_INPUT', '지원하지 않는 AI 퀘스트 레벨이에요.');
  }
  return value as AIQuestLevel;
}

function normalizeRewardCategory(
  value: unknown,
) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isActivityCategory(value)) {
    throwQuestError('QUEST_INVALID_INPUT', '보상 카테고리는 기존 활동 카테고리만 사용할 수 있어요.');
  }
  return value;
}

function normalizeEstimatedMinutes(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) {
    throwQuestError('QUEST_INVALID_INPUT', '예상 시간은 숫자로 입력해 주세요.');
  }

  const normalized = Math.floor(value);
  if (normalized < MIN_ESTIMATED_MINUTES) {
    throwQuestError('QUEST_INVALID_INPUT', '예상 시간은 1분 이상이어야 해요.');
  }
  if (normalized > MAX_ESTIMATED_MINUTES) {
    throwQuestError('QUEST_INVALID_INPUT', '예상 시간은 1,440분 이하로 입력해 주세요.');
  }

  return normalized;
}

function normalizeDateKey(value: unknown) {
  if (typeof value !== 'string') {
    throwQuestError('QUEST_INVALID_INPUT', '퀘스트 날짜는 YYYY-MM-DD 형식이어야 해요.');
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throwQuestError('QUEST_INVALID_INPUT', '퀘스트 날짜는 YYYY-MM-DD 형식이어야 해요.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throwQuestError('QUEST_INVALID_INPUT', '존재하지 않는 날짜예요.');
  }

  return value;
}

function normalizeActivityId(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throwQuestError('QUEST_INVALID_INPUT', '활동 ID는 문자열이어야 해요.');
  }

  const normalized = value.trim();
  return normalized || null;
}

function normalizeCreateQuestInput(input: CreateQuestInput): CreateQuestInput {
  const category = normalizeQuestCategory(input.category);
  const customCategoryLabel = category === 'custom'
    ? normalizeRequiredText(
      input.customCategoryLabel,
      '직접 입력 카테고리 이름',
      CUSTOM_CATEGORY_LABEL_MAX_LENGTH,
    )
    : undefined;
  const inputRewardCategory = normalizeRewardCategory(input.rewardCategory);
  const rewardCategory = inputRewardCategory === undefined
    ? (category === 'custom' ? null : category)
    : inputRewardCategory;

  return {
    title: normalizeRequiredText(input.title, '퀘스트 제목', TITLE_MAX_LENGTH),
    description: normalizeOptionalTextForCreate(
      input.description,
      '퀘스트 설명',
      DESCRIPTION_MAX_LENGTH,
    ),
    category,
    customCategoryLabel,
    rewardCategory,
    estimatedMinutes: normalizeEstimatedMinutes(input.estimatedMinutes),
    difficulty: normalizeDifficulty(input.difficulty),
    source: normalizeSource(input.source),
    scheduledDate: normalizeDateKey(input.scheduledDate),
    executionType: normalizeExecutionType(input.executionType) ?? undefined,
    aiQuestLevel: normalizeAIQuestLevel(input.aiQuestLevel) ?? undefined,
    recommendationReason: normalizeOptionalTextForCreate(
      input.recommendationReason,
      '추천 이유',
      RECOMMENDATION_REASON_MAX_LENGTH,
    ),
  };
}

function normalizeUpdateQuestInput(
  input: UpdateQuestInput,
  currentQuest: Quest,
): UpdateQuestInput {
  const normalized: UpdateQuestInput = {};

  if (input.title !== undefined) {
    normalized.title = normalizeRequiredText(input.title, '퀘스트 제목', TITLE_MAX_LENGTH);
  }
  if (input.description !== undefined) {
    normalized.description = normalizeOptionalTextForUpdate(
      input.description,
      '퀘스트 설명',
      DESCRIPTION_MAX_LENGTH,
    );
  }
  if (input.estimatedMinutes !== undefined) {
    normalized.estimatedMinutes = normalizeEstimatedMinutes(input.estimatedMinutes);
  }
  if (input.difficulty !== undefined) {
    normalized.difficulty = normalizeDifficulty(input.difficulty);
  }
  if (input.scheduledDate !== undefined) {
    normalized.scheduledDate = normalizeDateKey(input.scheduledDate);
  }
  if (input.recommendationReason !== undefined) {
    normalized.recommendationReason = normalizeOptionalTextForUpdate(
      input.recommendationReason,
      '추천 이유',
      RECOMMENDATION_REASON_MAX_LENGTH,
    );
  }

  if (input.executionType !== undefined) {
    normalized.executionType = normalizeExecutionType(input.executionType);
  }
  if (input.aiQuestLevel !== undefined) {
    normalized.aiQuestLevel = normalizeAIQuestLevel(input.aiQuestLevel);
  }

  const nextCategory = input.category === undefined
    ? currentQuest.category
    : normalizeQuestCategory(input.category);
  if (input.category !== undefined) {
    normalized.category = nextCategory;
  }

  const rewardCategory = normalizeRewardCategory(input.rewardCategory);
  if (rewardCategory !== undefined) {
    normalized.rewardCategory = rewardCategory;
  }

  if (nextCategory === 'custom') {
    const label = input.customCategoryLabel === undefined
      ? currentQuest.customCategoryLabel
      : normalizeOptionalTextForUpdate(
        input.customCategoryLabel,
        '직접 입력 카테고리 이름',
        CUSTOM_CATEGORY_LABEL_MAX_LENGTH,
      );

    if (!label) {
      throwQuestError('QUEST_INVALID_INPUT', '직접 입력 카테고리 이름을 입력해 주세요.');
    }

    if (input.customCategoryLabel !== undefined || input.category !== undefined) {
      normalized.customCategoryLabel = label;
    }
    if (input.category === 'custom' && input.rewardCategory === undefined) {
      normalized.rewardCategory = null;
    }
  } else if (input.category !== undefined || input.customCategoryLabel !== undefined) {
    normalized.customCategoryLabel = null;
    if (input.rewardCategory === undefined) {
      normalized.rewardCategory = nextCategory;
    }
  }

  if (Object.keys(normalized).length === 0) {
    throwQuestError('QUEST_INVALID_INPUT', '수정할 퀘스트 정보가 없어요.');
  }

  return normalized;
}

function ensurePendingQuest(quest: Quest, actionLabel: string) {
  if (quest.status === 'completed') {
    throwQuestError('QUEST_ALREADY_COMPLETED', `이미 완료한 퀘스트는 ${actionLabel}할 수 없어요.`);
  }
  if (quest.status === 'skipped') {
    throwQuestError('QUEST_ALREADY_SKIPPED', `이미 건너뛴 퀘스트는 ${actionLabel}할 수 없어요.`);
  }
}

export async function createQuest(
  userId: string,
  input: CreateQuestInput,
): Promise<Quest> {
  return createQuestRecord(userId, normalizeCreateQuestInput(input));
}

export async function createQuestFromDraft(
  userId: string,
  draft: QuestDraft,
): Promise<Quest> {
  return createQuest(userId, draft);
}

export async function getQuest(
  userId: string,
  questId: string,
): Promise<Quest | null> {
  return getQuestRecord(userId, questId);
}

export async function getTodayQuests(userId: string): Promise<Quest[]> {
  return getQuestsByDate(userId, createDateKey());
}

export async function getQuestsByDate(
  userId: string,
  dateKey: string,
): Promise<Quest[]> {
  return getQuestsByDateRecord(userId, normalizeDateKey(dateKey));
}

export async function updateQuest(
  userId: string,
  questId: string,
  input: UpdateQuestInput,
): Promise<Quest> {
  const currentQuest = await getQuestRecord(userId, questId);
  if (!currentQuest) {
    throwQuestError('QUEST_NOT_FOUND', '퀘스트를 찾을 수 없어요.');
  }

  ensurePendingQuest(currentQuest, '수정');
  return updateQuestRecord(userId, questId, normalizeUpdateQuestInput(input, currentQuest));
}

export async function deleteQuest(
  userId: string,
  questId: string,
): Promise<void> {
  const currentQuest = await getQuestRecord(userId, questId);
  if (!currentQuest) {
    throwQuestError('QUEST_NOT_FOUND', '퀘스트를 찾을 수 없어요.');
  }

  if (currentQuest.status === 'completed') {
    throwQuestError('QUEST_COMPLETED_DELETE_FORBIDDEN', '완료한 퀘스트는 삭제할 수 없어요.');
  }

  await deleteQuestRecord(userId, questId);
}

export async function completeQuest(
  userId: string,
  questId: string,
  input: CompleteQuestInput = {},
): Promise<QuestMutationResult> {
  const inputActivityId = normalizeActivityId(input.activityId);
  const completedAt = new Date();

  return runTransaction(firestore, async (transaction) => {
    const reference = questDocumentRef(userId, questId);
    const snapshot = await transaction.get(reference);

    if (!snapshot.exists()) {
      throwQuestError('QUEST_NOT_FOUND', '퀘스트를 찾을 수 없어요.');
    }

    const quest = mapQuestSnapshot(snapshot);

    if (quest.status === 'completed') {
      return {
        quest,
        alreadyProcessed: true,
      };
    }

    if (quest.status === 'skipped') {
      throwQuestError('QUEST_ALREADY_SKIPPED', '건너뛴 퀘스트는 완료할 수 없어요.');
    }

    const activityId = inputActivityId === undefined
      ? quest.activityId ?? null
      : inputActivityId;

    transaction.set(reference, {
      status: 'completed',
      completedAt: serverTimestamp(),
      skippedAt: null,
      activityId,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return {
      quest: {
        ...quest,
        status: 'completed',
        completedAt,
        skippedAt: null,
        activityId,
        updatedAt: completedAt,
      },
      alreadyProcessed: false,
    };
  });
}

export async function skipQuest(
  userId: string,
  questId: string,
): Promise<QuestMutationResult> {
  const skippedAt = new Date();

  return runTransaction(firestore, async (transaction) => {
    const reference = questDocumentRef(userId, questId);
    const snapshot = await transaction.get(reference);

    if (!snapshot.exists()) {
      throwQuestError('QUEST_NOT_FOUND', '퀘스트를 찾을 수 없어요.');
    }

    const quest = mapQuestSnapshot(snapshot);

    if (quest.status === 'skipped') {
      return {
        quest,
        alreadyProcessed: true,
      };
    }

    if (quest.status === 'completed') {
      throwQuestError('QUEST_ALREADY_COMPLETED', '완료한 퀘스트는 건너뛸 수 없어요.');
    }

    transaction.set(reference, {
      status: 'skipped',
      skippedAt: serverTimestamp(),
      completedAt: null,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return {
      quest: {
        ...quest,
        status: 'skipped',
        skippedAt,
        completedAt: null,
        updatedAt: skippedAt,
      },
      alreadyProcessed: false,
    };
  });
}
