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
export type IsometricStudyShelfRowId = 'bottom' | 'top';

export type IsometricCleaningMessType = 'paper' | 'dust' | 'cloth' | 'wrapper';

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
