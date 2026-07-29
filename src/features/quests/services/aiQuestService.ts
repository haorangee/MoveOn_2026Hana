import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';
import { firebaseFunctions } from '@/config/firebaseFunctions';
import type {
  AIQuestCategory,
  AIQuestExecutionType,
  AIQuestLevel,
  AIQuestOption,
  AIQuestResponse,
  GenerateAIQuestsRequest,
} from '@/contracts/ai-quest';

export type AIQuestServiceErrorCode =
  | 'unauthenticated'
  | 'invalid_argument'
  | 'unavailable'
  | 'invalid_response'
  | 'unknown';

export class AIQuestServiceError extends Error {
  code: AIQuestServiceErrorCode;

  constructor(code: AIQuestServiceErrorCode, message: string) {
    super(message);
    this.name = 'AIQuestServiceError';
    this.code = code;
  }
}

const MESSAGE_MAX_LENGTH = 500;
const QUEST_HISTORY_MAX_ITEMS = 20;

const AI_QUEST_CATEGORIES: AIQuestCategory[] = [
  'study',
  'cleaning',
  'shower',
  'water',
  'etc',
];

const AI_QUEST_EXECUTION_TYPES: AIQuestExecutionType[] = [
  'simple',
  'study',
  'cleaning',
  'shower',
  'water',
  'my_time',
];

const AI_QUEST_LEVELS: AIQuestLevel[] = [
  'very_easy',
  'easy',
  'action',
];

const generateAIQuestsCallable = httpsCallable<
  GenerateAIQuestsRequest,
  AIQuestResponse
>(firebaseFunctions, 'generateAIQuests');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAIQuestOption(value: unknown): value is AIQuestOption {
  if (!isRecord(value)) return false;

  const durationMinutes = value.durationMinutes;

  return typeof value.id === 'string'
    && typeof value.title === 'string'
    && AI_QUEST_CATEGORIES.includes(value.category as AIQuestCategory)
    && AI_QUEST_EXECUTION_TYPES.includes(
      value.executionType as AIQuestExecutionType,
    )
    && AI_QUEST_LEVELS.includes(value.level as AIQuestLevel)
    && (
      durationMinutes === undefined
      || (
        typeof durationMinutes === 'number'
        && Number.isFinite(durationMinutes)
      )
    );
}

function isAIQuestResponse(value: unknown): value is AIQuestResponse {
  return isRecord(value)
    && typeof value.empathy === 'string'
    && Array.isArray(value.quests)
    && value.quests.length === 3
    && value.quests.every(isAIQuestOption);
}

function validateHistory(
  history: string[] | undefined,
  fieldName: string,
): void {
  if (history && history.length > QUEST_HISTORY_MAX_ITEMS) {
    throw new AIQuestServiceError(
      'invalid_argument',
      `${fieldName}은 최대 ${QUEST_HISTORY_MAX_ITEMS}개까지 전달할 수 있어요.`,
    );
  }
}

function normalizeRequest(
  request: GenerateAIQuestsRequest,
): GenerateAIQuestsRequest {
  const message = request.message.trim();

  if (!message) {
    throw new AIQuestServiceError(
      'invalid_argument',
      '현재 상태를 한 글자 이상 입력해 주세요.',
    );
  }

  if (message.length > MESSAGE_MAX_LENGTH) {
    throw new AIQuestServiceError(
      'invalid_argument',
      `현재 상태는 ${MESSAGE_MAX_LENGTH}자 이내로 입력해 주세요.`,
    );
  }

  validateHistory(request.previousQuests, '이전 Quest');
  validateHistory(request.completedQuests, '완료한 Quest');

  return {
    ...request,
    message,
    ...(request.previousQuests && {
      previousQuests: [...request.previousQuests],
    }),
    ...(request.completedQuests && {
      completedQuests: [...request.completedQuests],
    }),
  };
}

function normalizeFirebaseError(error: unknown): AIQuestServiceError {
  if (!(error instanceof FirebaseError)) {
    return new AIQuestServiceError(
      'unknown',
      'AI Quest를 불러오지 못했어요.',
    );
  }

  switch (error.code) {
    case 'functions/unauthenticated':
      return new AIQuestServiceError(
        'unauthenticated',
        '로그인 후 AI Quest를 이용할 수 있어요.',
      );
    case 'functions/invalid-argument':
      return new AIQuestServiceError(
        'invalid_argument',
        'AI Quest 요청 내용을 확인해 주세요.',
      );
    case 'functions/unavailable':
      return new AIQuestServiceError(
        'unavailable',
        'AI Quest 연결이 잠시 지연되고 있어요. 다시 시도해 주세요.',
      );
    default:
      return new AIQuestServiceError(
        'unknown',
        'AI Quest를 불러오지 못했어요.',
      );
  }
}

export async function generateAIQuests(
  request: GenerateAIQuestsRequest,
): Promise<AIQuestResponse> {
  const payload = normalizeRequest(request);

  try {
    const result = await generateAIQuestsCallable(payload);

    if (!isAIQuestResponse(result.data)) {
      throw new AIQuestServiceError(
        'invalid_response',
        'AI Quest 응답 형식이 올바르지 않아요.',
      );
    }

    return result.data;
  } catch (error: unknown) {
    if (error instanceof AIQuestServiceError) {
      throw error;
    }

    throw normalizeFirebaseError(error);
  }
}
