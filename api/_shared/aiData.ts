import { getFirestore } from 'firebase-admin/firestore';
import type {
  DailyQuestSet,
  MoveOnTimesIssue,
  PersonalizedQuest,
  StudySessionRecord,
} from '../../src/contracts/ai-content';
import { getMoveOnAdminApp } from './firebaseAdmin';

export function adminStore() {
  return getFirestore(getMoveOnAdminApp());
}

export async function loadAiContext(userId: string) {
  const store = adminStore();
  const userRef = store.collection('users').doc(userId);
  const [profile, sessions, recentQuests] = await Promise.all([
    userRef.get(),
    userRef.collection('studySessions').orderBy('endedAt', 'desc').limit(30).get(),
    userRef.collection('dailyQuests').orderBy('date', 'desc').limit(7).get(),
  ]);

  const studySessions = sessions.docs.map((document) => document.data() as StudySessionRecord);
  const questHistory = recentQuests.docs.map((document) => document.data() as DailyQuestSet);
  const totalMinutes = Math.round(
    studySessions.reduce((sum, session) => sum + (session.elapsedSeconds || 0), 0) / 60,
  );
  const completedPages = studySessions.reduce(
    (sum, session) => sum + (session.completedPages || 0),
    0,
  );

  return {
    profile: profile.data() ?? {},
    studySessions,
    questHistory,
    summary: {
      sessionCount: studySessions.length,
      totalMinutes,
      completedPages,
      categories: studySessions.reduce<Record<string, number>>((result, session) => {
        const category = session.categoryLabel || session.categoryId || '자유 활동';
        result[category] = (result[category] ?? 0) + Math.round(session.elapsedSeconds / 60);
        return result;
      }, {}),
    },
  };
}

export function fallbackQuests(profile: Record<string, unknown>): PersonalizedQuest[] {
  const chapter = typeof profile.chapter === 'string' ? profile.chapter : 'general';
  const studyTitle = chapter === 'worker'
    ? '퇴근 후 10분 집중하기'
    : chapter === 'job-seeker'
      ? '가장 중요한 공부 15분 시작하기'
      : '오늘의 공부 15분 시작하기';

  return [
    {
      id: 'study-focus',
      type: 'study',
      title: studyTitle,
      reason: '짧게 시작해 오늘의 흐름을 만들어요.',
      targetMinutes: 15,
      completed: false,
      rewardExperience: 12,
      rewardCoin: 5,
    },
    {
      id: 'water-break',
      type: 'water',
      title: '물 한 잔 마시기',
      reason: '집중 전에 몸을 가볍게 깨워요.',
      targetMinutes: 2,
      completed: false,
      rewardExperience: 5,
      rewardCoin: 2,
    },
    {
      id: 'clean-one',
      type: 'clean',
      title: '책상 위 한 가지 정리하기',
      reason: '작은 정리가 다음 행동을 쉽게 만들어요.',
      targetMinutes: 3,
      completed: false,
      rewardExperience: 5,
      rewardCoin: 2,
    },
  ];
}

export function fallbackIssue(params: {
  userId: string;
  issueDate: string;
  volume: number;
  context: Awaited<ReturnType<typeof loadAiContext>>;
}): MoveOnTimesIssue {
  const name = typeof params.context.profile.nickname === 'string'
    ? params.context.profile.nickname
    : 'MoveOn 독자';
  const { completedPages, sessionCount, totalMinutes } = params.context.summary;

  return {
    issueId: params.issueDate,
    issueDate: params.issueDate,
    volume: params.volume,
    title: '작은 행동이 만든 오늘의 변화',
    tagline: '오늘의 행동 기록이 내일의 기사가 됩니다.',
    editorComment: '완벽한 하루보다 다시 시작한 순간을 기록합니다.',
    generatedAt: new Date().toISOString(),
    source: 'fallback',
    leadArticle: {
      section: '오늘의 특보',
      headline: `${name}, 자신의 속도로 한 걸음 전진`,
      quote: `최근 ${sessionCount}번의 집중 기록이 쌓였습니다.`,
      body: `총 ${totalMinutes}분 동안 집중하며 ${completedPages}페이지를 채웠습니다. 작은 기록이 모여 분명한 성장의 흔적이 되고 있습니다.`,
    },
    articles: [
      {
        section: '성장면',
        headline: '꾸준함은 기록에서 시작된다',
        quote: '오늘 남긴 한 줄이 내일의 방향이 됩니다.',
        body: 'MoveOn 편집부는 결과뿐 아니라 시작한 횟수와 돌아온 순간에도 주목합니다.',
      },
      {
        section: '생활면',
        headline: '작은 회복도 중요한 진전',
        quote: '쉬어 가는 시간은 다음 행동을 위한 준비입니다.',
        body: '물 마시기와 공간 정리처럼 부담 없는 행동도 하루의 리듬을 바꾸는 좋은 신호입니다.',
      },
      {
        section: '예고',
        headline: '다음 기록을 기다립니다',
        quote: '새로운 기사는 다음 행동에서 시작됩니다.',
        body: '짧은 공부 한 번, 작은 퀘스트 하나가 다음 MoveOn Times의 주인공이 됩니다.',
      },
    ],
  };
}
