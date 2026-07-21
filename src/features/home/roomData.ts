import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type RoomObjectId =
  | 'desk'
  | 'bookshelf'
  | 'newspaper'
  | 'plant'
  | 'bed'
  | 'bathroom'
  | 'window'
  | 'floor'
  | 'settings';

export type RoomObject = {
  id: RoomObjectId;
  title: string;
  description: string;
  actionLabel: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  route?: Href;
};

export type RoomHotspot = RoomObject & {
  frame: {
    left: `${number}%`;
    top: `${number}%`;
    width: `${number}%`;
    height: `${number}%`;
  };
  marker: {
    left: `${number}%`;
    top: `${number}%`;
  };
};

export const roomHotspots: RoomHotspot[] = [
  {
    id: 'bathroom',
    title: '욕실 문',
    description: '따뜻한 물로 가볍게 씻고 컨디션을 정돈해요.',
    actionLabel: '샤워하기',
    icon: 'water-outline',
    frame: { left: '0%', top: '12%', width: '19%', height: '42%' },
    marker: { left: '5%', top: '35%' },
  },
  {
    id: 'window',
    title: '창문',
    description: '잠시 바깥 풍경을 바라보며 숨을 고를 수 있어요.',
    actionLabel: '풍경 보기',
    icon: 'sunny-outline',
    frame: { left: '17%', top: '8%', width: '35%', height: '31%' },
    marker: { left: '34%', top: '19%' },
  },
  {
    id: 'desk',
    title: '책상',
    description: '오늘 쌓고 싶은 시간을 골라 공부를 시작해요.',
    actionLabel: '공부 시작',
    icon: 'pencil-outline',
    route: '/study-desk',
    frame: { left: '12%', top: '28%', width: '49%', height: '27%' },
    marker: { left: '43%', top: '39%' },
  },
  {
    id: 'bookshelf',
    title: '책장',
    description: '집중한 시간이 책이 되어 차곡차곡 쌓이는 곳이에요.',
    actionLabel: '책 선택',
    icon: 'library-outline',
    route: '/study-desk',
    frame: { left: '54%', top: '17%', width: '28%', height: '35%' },
    marker: { left: '69%', top: '29%' },
  },
  {
    id: 'bed',
    title: '침대',
    description: '오늘은 조금 쉬어가도 괜찮아요.',
    actionLabel: '휴식하기',
    icon: 'moon-outline',
    frame: { left: '55%', top: '37%', width: '45%', height: '31%' },
    marker: { left: '83%', top: '47%' },
  },
  {
    id: 'plant',
    title: '화분',
    description: '마실 물을 챙기고 화분에도 물을 나눠 줘요.',
    actionLabel: '물 주기',
    icon: 'leaf-outline',
    frame: { left: '0%', top: '56%', width: '25%', height: '27%' },
    marker: { left: '8%', top: '67%' },
  },
  {
    id: 'floor',
    title: '방 바닥',
    description: '눈에 띄는 곳만 가볍게 정리해도 방이 한결 편안해져요.',
    actionLabel: '방청소하기',
    icon: 'sparkles-outline',
    frame: { left: '20%', top: '65%', width: '43%', height: '28%' },
    marker: { left: '42%', top: '77%' },
  },
  {
    id: 'newspaper',
    title: 'Move On Times',
    description: '오늘의 작은 행동이 어떤 뉴스가 되었는지 확인해요.',
    actionLabel: '신문 펼치기',
    icon: 'newspaper-outline',
    route: '/newspaper',
    frame: { left: '66%', top: '72%', width: '34%', height: '26%' },
    marker: { left: '83%', top: '84%' },
  },
];
