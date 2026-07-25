import type { IsometricRoomObjectLayout } from '../types/isometricRoom';

export const ROOM_DESIGN_WIDTH = 768;
export const ROOM_DESIGN_HEIGHT = 620;

// Temporary hotspot positions for the image-based room preview.
// Final coordinates should be tuned after assets/images/isometric-room/moveon-room-v1.png is added.
export const isometricRoomObjects: IsometricRoomObjectLayout[] = [
  {
    id: 'bed',
    label: '휴식 공간',
    x: 108,
    y: 134,
    width: 205,
    height: 116,
    zIndex: 8,
  },
  {
    id: 'vanity',
    label: '화장대',
    x: 66,
    y: 314,
    width: 122,
    height: 92,
    zIndex: 12,
  },
  {
    id: 'waterPlant',
    label: '물·식물',
    x: 92,
    y: 408,
    width: 116,
    height: 108,
    zIndex: 20,
    interactive: true,
  },
  {
    id: 'studyDesk',
    label: '공부',
    x: 488,
    y: 188,
    width: 186,
    height: 118,
    zIndex: 11,
    interactive: true,
  },
  {
    id: 'bookshelf',
    label: '책장',
    x: 612,
    y: 78,
    width: 86,
    height: 144,
    zIndex: 9,
    interactive: true,
  },
  {
    id: 'showerDoor',
    label: '샤워',
    x: 682,
    y: 198,
    width: 64,
    height: 150,
    zIndex: 10,
    interactive: true,
  },
  {
    id: 'centerTable',
    label: '생활 테이블',
    x: 318,
    y: 380,
    width: 178,
    height: 104,
    zIndex: 16,
  },
  {
    id: 'questBoard',
    label: '오늘의 퀘스트',
    x: 486,
    y: 74,
    width: 126,
    height: 90,
    zIndex: 14,
    interactive: true,
  },
  {
    id: 'newspaper',
    label: 'Move On Times',
    x: 398,
    y: 398,
    width: 76,
    height: 42,
    zIndex: 24,
    rotation: '-8deg',
    interactive: true,
  },
  {
    id: 'cleaningFloor',
    label: '청소',
    x: 222,
    y: 480,
    width: 92,
    height: 74,
    zIndex: 25,
    rotation: '-18deg',
    interactive: true,
  },
  {
    id: 'character',
    label: '나',
    x: 356,
    y: 438,
    width: 82,
    height: 112,
    zIndex: 30,
  },
  {
    id: 'pet',
    label: '펫',
    x: 462,
    y: 484,
    width: 74,
    height: 52,
    zIndex: 31,
  },
];

export const isometricRoomHotspots = isometricRoomObjects.filter(
  (object) => object.interactive,
);

export function getIsometricRoomObject(id: IsometricRoomObjectLayout['id']) {
  return isometricRoomObjects.find((object) => object.id === id);
}
