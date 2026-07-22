import type { Href } from 'expo-router';

export type RoomObjectId =
  | 'desk'
  | 'bookshelf'
  | 'newspaper'
  | 'plant'
  | 'bed'
  | 'bathroom'
  | 'window'
  | 'floor';

export type RoomActivity =
  | 'desk'
  | 'bookshelf'
  | 'window'
  | 'bed'
  | 'plant'
  | 'bathroom'
  | 'walking';

export type RoomObject = {
  id: RoomObjectId;
  title: string;
  description: string;
  actionLabel: string;
  feedback: string;
  activity: RoomActivity;
  route?: Href;
};

export type RoomHotspot = RoomObject & {
  frame: {
    left: `${number}%`;
    top: `${number}%`;
    width: `${number}%`;
    height: `${number}%`;
  };
  focus: {
    x: number;
    y: number;
    scale: number;
  };
};

export const roomHotspots: RoomHotspot[] = [
  {
    id: 'bathroom',
    title: '욕실 문',
    description: '따뜻한 물로 가볍게 씻고 컨디션을 정돈해요.',
    actionLabel: '샤워하기',
    feedback: '수건을 챙겨 욕실로 가는 중…',
    activity: 'bathroom',
    frame: { left: '0%', top: '13%', width: '15%', height: '42%' },
    focus: { x: 0.08, y: 0.35, scale: 1.7 },
  },
  {
    id: 'window',
    title: '창문',
    description: '잠시 창밖 풍경과 날씨를 바라봐요.',
    actionLabel: '풍경 보기',
    feedback: '커튼 사이로 오늘의 날씨를 바라봐요.',
    activity: 'window',
    frame: { left: '16%', top: '6%', width: '35%', height: '22%' },
    focus: { x: 0.33, y: 0.25, scale: 1.62 },
  },
  {
    id: 'desk',
    title: '책상',
    description: '오늘 채우고 싶은 시간을 골라 공부를 시작해요.',
    actionLabel: '공부 시작',
    feedback: '책상 앞으로 천천히 다가가는 중…',
    activity: 'desk',
    route: '/study-desk',
    frame: { left: '16%', top: '27%', width: '43%', height: '29%' },
    focus: { x: 0.37, y: 0.44, scale: 1.5 },
  },
  {
    id: 'bookshelf',
    title: '책장',
    description: '공부한 시간이 색과 두께가 다른 책으로 쌓여 있어요.',
    actionLabel: '공부 기록',
    feedback: '내가 쌓아온 공부 기록을 펼쳐보는 중…',
    activity: 'bookshelf',
    route: '/bookshelf',
    frame: { left: '54.8%', top: '18.6%', width: '21.2%', height: '60.8%' },
    focus: { x: 0.66, y: 0.34, scale: 1.7 },
  },
  {
    id: 'bed',
    title: '침대',
    description: '오늘의 에너지를 내려놓고 포근하게 쉬어요.',
    actionLabel: '수면',
    feedback: '마루와 함께 침대를 정돈하고 있어요.',
    activity: 'bed',
    frame: { left: '55%', top: '36%', width: '45%', height: '31%' },
    focus: { x: 0.78, y: 0.51, scale: 1.48 },
  },
  {
    id: 'plant',
    title: '화분',
    description: '식물과 나를 위해 물 한 잔을 천천히 마셔요.',
    actionLabel: '물 마시기',
    feedback: '잎사귀를 살피며 물을 나눠 주는 중…',
    activity: 'plant',
    frame: { left: '0%', top: '56%', width: '25%', height: '28%' },
    focus: { x: 0.1, y: 0.69, scale: 1.62 },
  },
  {
    id: 'floor',
    title: '방 바닥',
    description: '눈에 보이는 곳만 가볍게 정리해도 방이 한결 편안해져요.',
    actionLabel: '방 청소하기',
    feedback: '마루가 신나게 따라다니며 청소를 돕고 있어요.',
    activity: 'walking',
    frame: { left: '18%', top: '61%', width: '40%', height: '28%' },
    focus: { x: 0.4, y: 0.73, scale: 1.36 },
  },
  {
    id: 'newspaper',
    title: 'Move On Times',
    description: '오늘의 작은 행동들이 어떤 이야기로 이어졌는지 확인해요.',
    actionLabel: '신문 펼치기',
    feedback: '바스락— 오늘의 신문 첫 면을 펼치는 중…',
    activity: 'walking',
    route: '/newspaper',
    frame: { left: '57%', top: '73%', width: '43%', height: '25%' },
    focus: { x: 0.78, y: 0.84, scale: 1.78 },
  },
];

export function getRoomHotspot(id: RoomObjectId) {
  return roomHotspots.find((hotspot) => hotspot.id === id);
}
