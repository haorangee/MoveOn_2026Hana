import type { IsometricRoomObjectLayout } from '../types/isometricRoom';

export const ROOM_DESIGN_WIDTH = 768;
export const ROOM_DESIGN_HEIGHT = 512;

// Hotspot positions use the 768 x 512 app coordinate system for
// assets/images/isometric-room/moveon-room-v1.png.
export const vacuumCleanerLayout = {
  x: 190,
  y: 145,
  width: 76,
  height: 190,
  zIndex: 18,
  rotation: '22deg',
} satisfies Pick<
  IsometricRoomObjectLayout,
  'height' | 'rotation' | 'width' | 'x' | 'y' | 'zIndex'
>;

const VACUUM_CLEANER_HOTSPOT_PADDING = 8;

export const vacuumCleanerHotspotLayout = {
  x: vacuumCleanerLayout.x + 2,
  y: vacuumCleanerLayout.y + 18,
  width: 70,
  height: 156,
  zIndex: vacuumCleanerLayout.zIndex + 1,
  rotation: vacuumCleanerLayout.rotation,
} satisfies Pick<
  IsometricRoomObjectLayout,
  'height' | 'rotation' | 'width' | 'x' | 'y' | 'zIndex'
>;

export const isometricRoomObjects: IsometricRoomObjectLayout[] = [
  {
    id: 'bed',
    label: '휴식 공간',
    x: 230,
    y: 144,
    width: 158,
    height: 96,
    zIndex: 8,
  },
  {
    id: 'vanity',
    label: '화장대',
    x: 78,
    y: 186,
    width: 118,
    height: 84,
    zIndex: 12,
  },
  {
    id: 'waterPlant',
    label: '물·식물',
    x: 56,
    y: 262,
    width: 74,
    height: 78,
    zIndex: 40,
    interactive: true,
  },
  {
    id: 'studyDesk',
    label: '공부',
    x: 404,
    y: 154,
    width: 154,
    height: 114,
    zIndex: 50,
    interactive: true,
  },
  {
    id: 'bookshelf',
    label: '책장',
    x: 562,
    y: 138,
    width: 72,
    height: 144,
    zIndex: 60,
    interactive: true,
  },
  {
    id: 'showerDoor',
    label: '샤워',
    x: 632,
    y: 142,
    width: 76,
    height: 172,
    zIndex: 45,
    interactive: true,
  },
  {
    id: 'centerTable',
    label: '생활 테이블',
    x: 316,
    y: 304,
    width: 160,
    height: 92,
    zIndex: 16,
  },
  {
    id: 'questBoard',
    label: '오늘의 퀘스트',
    x: 508,
    y: 86,
    width: 112,
    height: 80,
    zIndex: 65,
    interactive: true,
  },
  {
    id: 'newspaper',
    label: 'Move On Times',
    x: 344,
    y: 304,
    width: 104,
    height: 54,
    zIndex: 70,
    interactive: true,
  },
  {
    id: 'cleaningFloor',
    label: '청소',
    ...vacuumCleanerHotspotLayout,
    interactive: true,
  },
  {
    id: 'character',
    label: '나',
    x: 344,
    y: 372,
    width: 82,
    height: 112,
    zIndex: 30,
  },
  {
    id: 'pet',
    label: '펫',
    x: 448,
    y: 410,
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
