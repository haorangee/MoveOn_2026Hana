export type IsometricRoomObjectId =
  | 'bed'
  | 'vanity'
  | 'waterPlant'
  | 'studyDesk'
  | 'bookshelf'
  | 'showerDoor'
  | 'centerTable'
  | 'questBoard'
  | 'newspaper'
  | 'cleaningFloor'
  | 'character'
  | 'pet';

export type VacuumCleanerState = 'idle' | 'active';
export type IsometricPlantStage = 0 | 1 | 2 | 3 | 4 | 5;
export type IsometricCleaningStage = 0 | 1 | 2 | 3;
export type IsometricShowerStage = 0 | 1;
export type IsometricStudyShelfRowId = 'bottom' | 'top';

export type IsometricCleaningMessType = 'paper' | 'dust' | 'cloth' | 'wrapper';
export type IsometricFreshnessEffectType = 'sparkle' | 'dot' | 'droplet';
export type IsometricMovementDirection = 'up' | 'down' | 'left' | 'right';
export type IsometricCharacterFacingDirection = 'left' | 'right';

export interface IsometricCharacterPosition {
  x: number;
  y: number;
}

export interface IsometricMovementVector {
  dx: number;
  dy: number;
}

export interface IsometricPoint {
  x: number;
  y: number;
}

export interface IsometricObstacle {
  id: string;
  polygon: IsometricPoint[];
}

export interface IsometricRoomRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IsometricRoomObjectLayout extends IsometricRoomRect {
  id: IsometricRoomObjectId;
  label: string;
  zIndex: number;
  interactive?: boolean;
  rotation?: `${number}deg`;
  opacity?: number;
  backgroundColor?: string;
}

export interface IsometricStudyBookVisual extends IsometricRoomRect {
  id: string;
  categoryId: string;
  color: string;
  colorDark: string;
  rowId: IsometricStudyShelfRowId;
  rotation?: `${number}deg`;
}

export interface IsometricCleaningMessItem extends IsometricRoomRect {
  id: string;
  type: IsometricCleaningMessType;
  rotation?: `${number}deg`;
  visibleUntilStage: IsometricCleaningStage;
  zIndex: number;
}

export interface IsometricFreshnessEffectItem {
  id: string;
  type: IsometricFreshnessEffectType;
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation?: `${number}deg`;
}
