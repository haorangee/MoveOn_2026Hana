import {
  type MoveOnNews,
  MOVEON_NEWS_SCHEMA,
  buildFallbackMoveOnNews,
  normalizeMoveOnNews,
  normalizeNewsActivitySummary,
} from '../src/contracts/moveon-news';
import { configureCors, type ApiRequest, type ApiResponse } from './_shared/http';
import { generateStructuredJson } from './_shared/openai';

type GenerateNewsBody = {
  userName?: unknown;
  activities?: unknown;
};

function parseBody(body: unknown): GenerateNewsBody {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as GenerateNewsBody;
    } catch {
      return {};
    }
  }
  return body && typeof body === 'object' ? body as GenerateNewsBody : {};
}

function buildSummary(body: GenerateNewsBody) {
  const activities = body.activities && typeof body.activities === 'object'
    ? body.activities as Record<string, unknown>
    : {};

  return normalizeNewsActivitySummary({
    ...activities,
    userName: body.userName ?? activities.userName,
  });
}

const NEWS_INSTRUCTIONS = [
  '당신은 MoveOn 앱의 생활 뉴스 기자입니다.',
  '사용자의 실제 행동 기록만 사용하여 짧고 유쾌한 개인화 신문 기사를 작성하세요.',
  '작성 규칙:',
  '1. 제공되지 않은 행동, 횟수, 시간 또는 성과를 만들지 마세요.',
  '2. 진지한 신문 보도체와 귀여운 과장을 조합하세요.',
  '3. 사용자를 조롱하거나 비난하지 마세요.',
  '4. 죄책감, 실패, 게으름 등의 부정적인 표현을 사용하지 마세요.',
  '5. 작은 행동도 재미있는 사건처럼 표현하세요.',
  '6. 각 제목과 부제목은 모바일 화면에서 잘리지 않도록 짧게 작성하세요.',
  '7. 모든 문구는 자연스러운 한국어로 작성하세요.',
  '8. 지정된 JSON 구조로만 응답하세요.',
].join('\n');

export default async function handler(request: ApiRequest, response: ApiResponse) {
  configureCors(request, response);

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ message: 'POST 요청만 지원합니다.' });
    return;
  }

  const summary = buildSummary(parseBody(request.body));
  const fallbackNews = buildFallbackMoveOnNews(summary);
  const model = process.env.OPENAI_MODEL;

  if (!process.env.OPENAI_API_KEY || !model) {
    response.status(503).json({
      message: 'AI 뉴스 서버 환경변수가 아직 설정되지 않았어요.',
      fallbackNews,
    });
    return;
  }

  try {
    const generatedNews = await generateStructuredJson<MoveOnNews>({
      model,
      schemaName: 'moveon_news',
      schema: MOVEON_NEWS_SCHEMA,
      instructions: NEWS_INSTRUCTIONS,
      input: {
        userName: summary.userName,
        activities: summary,
      },
      userId: summary.userName,
      timeoutMs: 12000,
    });
    const news = normalizeMoveOnNews(generatedNews);

    if (!news) {
      response.status(200).json({ news: fallbackNews, source: 'fallback' });
      return;
    }

    response.status(200).json({ news, source: 'ai' });
  } catch {
    response.status(200).json({ news: fallbackNews, source: 'fallback' });
  }
}
