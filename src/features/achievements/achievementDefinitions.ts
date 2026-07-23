import type { AchievementDefinition } from '@/features/achievements/types/achievement';

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_xp',
    title: '첫 성장',
    description: '처음으로 경험치를 쌓았어요.',
    sortOrder: 1,
  },
  {
    id: 'steady_growth',
    title: '꾸준한 성장',
    description: '누적 경험치 300을 달성했어요.',
    sortOrder: 2,
  },
  {
    id: 'study_hours_10',
    title: '10시간 공부',
    description: '공부 시간이 10시간을 넘었어요.',
    sortOrder: 3,
  },
  {
    id: 'study_hours_50',
    title: '50시간 공부',
    description: '공부 시간이 50시간을 넘었어요.',
    sortOrder: 4,
  },
  {
    id: 'category_master',
    title: '카테고리 마스터',
    description: '한 카테고리 레벨 3을 달성했어요.',
    sortOrder: 5,
  },
  {
    id: 'completion_streak',
    title: '반복의 힘',
    description: '같은 카테고리를 10회 이상 완료했어요.',
    sortOrder: 6,
  },
  {
    id: 'grape_collector',
    title: '포도 수집가',
    description: '포도 100개를 모았어요.',
    sortOrder: 7,
  },
];
