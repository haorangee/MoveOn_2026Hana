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
