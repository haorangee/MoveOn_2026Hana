export type NewsActivitySummary = {
  userName: string;
  periodStart: string;
  periodEnd: string;
  studyMinutes: number;
  studySessions: number;
  booksCreated: number;
  waterCount: number;
  waterGoalCompleted: boolean;
  cleaningCount: number;
  showerMinutes: number;
  showerCount: number;
};

export type MoveOnNews = {
  newspaperName: string;
  dateLabel: string;
  mainHeadline: string;
  mainSubheadline: string;
  studyHeadline: string;
  studySubheadline: string;
  lifeHeadline: string;
  lifeSubheadline: string;
  closingMessage: string;
};

export const MOVEON_NEWS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'newspaperName',
    'dateLabel',
    'mainHeadline',
    'mainSubheadline',
    'studyHeadline',
    'studySubheadline',
    'lifeHeadline',
    'lifeSubheadline',
    'closingMessage',
  ],
  properties: {
    newspaperName: { type: 'string' },
    dateLabel: { type: 'string' },
    mainHeadline: { type: 'string' },
    mainSubheadline: { type: 'string' },
    studyHeadline: { type: 'string' },
    studySubheadline: { type: 'string' },
    lifeHeadline: { type: 'string' },
    lifeSubheadline: { type: 'string' },
    closingMessage: { type: 'string' },
  },
};

const DEFAULT_USER_NAME = 'MoveOn 주민';
const MAX_TEXT_LENGTH = 80;

function safeString(value: unknown, fallback: string, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

function safeDateKey(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function safeNonNegativeInteger(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.floor(number));
}

export function getLocalDateKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatKoreanDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-');
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

export function normalizeNewsActivitySummary(value: unknown): NewsActivitySummary {
  const today = getLocalDateKey();
  const source = value && typeof value === 'object'
    ? value as Partial<NewsActivitySummary>
    : {};

  const periodStart = safeDateKey(source.periodStart, today);
  const periodEnd = safeDateKey(source.periodEnd, today);
  const waterCount = Math.min(5, safeNonNegativeInteger(source.waterCount));

  return {
    userName: safeString(source.userName, DEFAULT_USER_NAME, 24),
    periodStart,
    periodEnd,
    studyMinutes: safeNonNegativeInteger(source.studyMinutes),
    studySessions: safeNonNegativeInteger(source.studySessions),
    booksCreated: safeNonNegativeInteger(source.booksCreated),
    waterCount,
    waterGoalCompleted: source.waterGoalCompleted === true || waterCount >= 5,
    cleaningCount: Math.min(3, safeNonNegativeInteger(source.cleaningCount)),
    showerMinutes: safeNonNegativeInteger(source.showerMinutes),
    showerCount: safeNonNegativeInteger(source.showerCount),
  };
}

export function normalizeMoveOnNews(value: unknown): MoveOnNews | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Partial<MoveOnNews>;
  const news: MoveOnNews = {
    newspaperName: safeString(source.newspaperName, 'MOVEON TIMES', 32),
    dateLabel: safeString(source.dateLabel, formatKoreanDateLabel(getLocalDateKey()), 32),
    mainHeadline: safeString(source.mainHeadline, '오늘의 작은 행동이 뉴스가 됐어요', 42),
    mainSubheadline: safeString(source.mainSubheadline, 'MoveOn 편집부가 오늘의 기록을 확인했어요.', 64),
    studyHeadline: safeString(source.studyHeadline, '공부 기록 대기 중', 42),
    studySubheadline: safeString(source.studySubheadline, '다음 집중 시간이 새 기사로 이어질 예정이에요.', 64),
    lifeHeadline: safeString(source.lifeHeadline, '생활 기록 확인', 42),
    lifeSubheadline: safeString(source.lifeSubheadline, '작은 루틴이 방 안의 분위기를 바꾸고 있어요.', 64),
    closingMessage: safeString(source.closingMessage, '작은 행동이 모여 꽤 멋진 하루가 됐어요.', 80),
  };
  return news;
}

function hasStudy(summary: NewsActivitySummary) {
  return summary.studyMinutes > 0 || summary.studySessions > 0 || summary.booksCreated > 0;
}

function hasLife(summary: NewsActivitySummary) {
  return summary.waterCount > 0
    || summary.cleaningCount > 0
    || summary.showerMinutes > 0
    || summary.showerCount > 0;
}

export function buildFallbackMoveOnNews(summaryInput: unknown): MoveOnNews {
  const summary = normalizeNewsActivitySummary(summaryInput);
  const name = summary.userName;
  const dateLabel = summary.periodStart === summary.periodEnd
    ? formatKoreanDateLabel(summary.periodEnd)
    : `${summary.periodStart} ~ ${summary.periodEnd}`;

  const studyHeadline = hasStudy(summary)
    ? `공부 ${summary.studyMinutes}분 기록`
    : '공부 기사는 다음 호 예고';
  const studySubheadline = hasStudy(summary)
    ? `집중 ${summary.studySessions}회와 새 책 ${summary.booksCreated}권이 책장 소식을 만들었어요.`
    : '아직 공부 기록은 없지만, 첫 기록이 생기면 바로 특보가 됩니다.';

  const lifeParts = [
    summary.waterCount > 0 ? `물 ${summary.waterCount}잔` : '',
    summary.cleaningCount > 0 ? `청소 ${summary.cleaningCount}회` : '',
    summary.showerMinutes > 0 ? `샤워 ${summary.showerMinutes}분` : '',
  ].filter(Boolean);

  const lifeHeadline = lifeParts.length > 0
    ? `${lifeParts[0]} 소식 도착`
    : '생활면은 조용히 준비 중';
  const lifeSubheadline = lifeParts.length > 0
    ? `${lifeParts.join(', ')} 기록이 오늘의 생활면을 채웠어요.`
    : '물 마시기, 청소, 샤워 기록이 생기면 생활면이 더 풍성해져요.';

  const mainHeadline = hasStudy(summary) || hasLife(summary)
    ? `${name}, 오늘도 작은 기록 남김`
    : `${name}, 다음 뉴스를 기다리는 중`;
  const mainSubheadline = hasStudy(summary) || hasLife(summary)
    ? 'MoveOn 편집부 “작은 행동도 충분히 기사감”'
    : '오늘의 첫 행동이 곧 헤드라인이 될 예정이에요.';

  return {
    newspaperName: 'MOVEON TIMES',
    dateLabel,
    mainHeadline,
    mainSubheadline,
    studyHeadline,
    studySubheadline,
    lifeHeadline,
    lifeSubheadline,
    closingMessage: '작은 행동이 모여 이번 호도 꽤 멋진 뉴스가 됐어요.',
  };
}
