import { httpsCallable } from 'firebase/functions';
import { firebaseAuth } from '@/config/firebaseAuth';
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
  | 'internal'
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

function getErrorIdentity(error: unknown): { code: string; name: string } {
  if (!isRecord(error)) {
    return {
      code: 'unknown',
      name: error instanceof Error ? error.name : typeof error,
    };
  }

  return {
    code: typeof error.code === 'string' ? error.code : 'unknown',
    name: typeof error.name === 'string' ? error.name : 'unknown',
  };
}

function isDevelopment() {
  return typeof __DEV__ !== 'undefined' && __DEV__;
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
  const { code } = getErrorIdentity(error);

  switch (code) {
    case 'functions/unauthenticated':
    case 'auth/user-token-expired':
    case 'auth/invalid-user-token':
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
    case 'functions/deadline-exceeded':
    case 'functions/resource-exhausted':
    case 'auth/network-request-failed':
      return new AIQuestServiceError(
        'unavailable',
        'AI Quest 연결이 잠시 지연되고 있어요. 다시 시도해 주세요.',
      );
    case 'functions/internal':
      return new AIQuestServiceError(
        'internal',
        'AI Quest를 처리하는 중 서버 오류가 발생했어요.',
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
    await firebaseAuth.authStateReady();

    const currentUser = firebaseAuth.currentUser;

    if (isDevelopment()) {
      console.info('[AIQuest] auth ready');
      console.info('[AIQuest] has current user:', Boolean(currentUser));
      console.info('[AIQuest] user anonymous:', currentUser?.isAnonymous ?? false);
    }

    if (!currentUser) {
      throw new AIQuestServiceError(
        'unauthenticated',
        '로그인 후 AI Quest를 이용할 수 있어요.',
      );
    }

    if (isDevelopment()) {
      console.info('[AIQuest] calling generateAIQuests');
    }

    const result = await generateAIQuestsCallable(payload);

    if (isDevelopment()) {
      console.info('[AIQuest] generateAIQuests success');
    }

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

    if (isDevelopment()) {
      console.warn(
        '[AIQuest] callable failed',
        JSON.stringify(getErrorIdentity(error)),
      );
    }

    throw normalizeFirebaseError(error);
  }
}
