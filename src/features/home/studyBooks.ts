export type StudyCategory = {
  id: 'coding' | 'startup' | 'toeic' | 'reading';
  label: string;
  minutes: number;
  color: string;
  colorDark: string;
};

export const studyCategories: StudyCategory[] = [
  {
    id: 'coding',
    label: '코딩',
    minutes: 420,
    color: '#6288A8',
    colorDark: '#466A89',
  },
  {
    id: 'startup',
    label: '창업',
    minutes: 245,
    color: '#78906B',
    colorDark: '#576F4C',
  },
  {
    id: 'toeic',
    label: '토익',
    minutes: 180,
    color: '#C28D91',
    colorDark: '#9E6B70',
  },
  {
    id: 'reading',
    label: '독서',
    minutes: 95,
    color: '#9A7358',
    colorDark: '#76513D',
  },
];

export function getBookCount(minutes: number) {
  return Math.max(1, Math.ceil(minutes / 75));
}

export function formatStudyTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}시간 ${rest}분` : `${hours}시간`;
}
