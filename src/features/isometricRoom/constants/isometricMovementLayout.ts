import {
  isometricCharacterAnchor,
  isometricPetAnchor,
} from './isometricRoomLayout';
import type {
  IsometricCharacterPosition,
  IsometricObstacle,
  IsometricPetPosition,
  IsometricPoint,
} from '../types/isometricRoom';

export const ISOMETRIC_CHARACTER_POSITION_STORAGE_KEY =
  '@moveon/isometric-character-position/v1';
export const ISOMETRIC_CHARACTER_POSITION_STORAGE_VERSION = 1;

export const ISOMETRIC_JOYSTICK_BASE_SIZE = 136;
export const ISOMETRIC_JOYSTICK_KNOB_SIZE = 54;
export const ISOMETRIC_JOYSTICK_MAX_RADIUS = 41;
export const ISOMETRIC_JOYSTICK_DEAD_ZONE = 10;
export const ISOMETRIC_MIN_MOVEMENT_SPEED = 34;
export const ISOMETRIC_MAX_MOVEMENT_SPEED = 114;
export const ISOMETRIC_MAX_FRAME_DELTA_SECONDS = 0.05;
export const ISOMETRIC_COLLISION_SUBSTEP_SIZE = 3;
export const ISOMETRIC_TAP_MOVE_DISTANCE = 18;
export const ISOMETRIC_TAP_MOVE_ANIMATION_MS = 150;
export const ISOMETRIC_POSITION_SAVE_DEBOUNCE_MS = 450;
export const ISOMETRIC_PET_ESCAPE_ANIMATION_MS = 190;
export const ISOMETRIC_PET_CHARACTER_MIN_DISTANCE = 42;
export const ISOMETRIC_FACING_HORIZONTAL_THRESHOLD = 0.08;

export const ISOMETRIC_CHARACTER_COLLISION_RADIUS = {
  horizontal: 15,
  vertical: 8,
};

export const ISOMETRIC_PET_COLLISION_RADIUS = {
  horizontal: 18,
  vertical: 9,
};

export const DEFAULT_ISOMETRIC_CHARACTER_POSITION: IsometricCharacterPosition = {
  x: isometricCharacterAnchor.x,
  y: isometricCharacterAnchor.y,
};

export const DEFAULT_ISOMETRIC_PET_POSITION: IsometricPetPosition = {
  x: isometricPetAnchor.x,
  y: isometricPetAnchor.y,
};

// Pink floor boundary measured in the existing 768 x 512 room artwork.
// The inset keeps the character's feet away from the wall and front trim.
export const ISOMETRIC_WALKABLE_POLYGON: IsometricPoint[] = [
  { x: 88, y: 294 },
  { x: 369, y: 181 },
  { x: 680, y: 294 },
  { x: 396, y: 476 },
];

// Furniture footprints are intentionally conservative for the MVP. They use
// the same 768 x 512 design coordinates as isometricRoomLayout.ts.
export const ISOMETRIC_FIXED_MOVEMENT_OBSTACLES: IsometricObstacle[] = [
  {
    id: 'bed',
    polygon: [
      { x: 220, y: 201 },
      { x: 322, y: 161 },
      { x: 391, y: 201 },
      { x: 278, y: 270 },
      { x: 225, y: 247 },
    ],
  },
  {
    id: 'vanity-and-stool',
    polygon: [
      { x: 78, y: 244 },
      { x: 159, y: 209 },
      { x: 226, y: 251 },
      { x: 141, y: 311 },
      { x: 91, y: 290 },
    ],
  },
  {
    id: 'water-plant',
    polygon: [
      { x: 43, y: 273 },
      { x: 90, y: 249 },
      { x: 140, y: 284 },
      { x: 91, y: 332 },
    ],
  },
  {
    id: 'stored-vacuum-cleaner',
    polygon: [
      { x: 181, y: 228 },
      { x: 214, y: 216 },
      { x: 247, y: 252 },
      { x: 210, y: 279 },
    ],
  },
  {
    id: 'study-desk-and-chair',
    polygon: [
      { x: 392, y: 221 },
      { x: 492, y: 175 },
      { x: 614, y: 231 },
      { x: 515, y: 304 },
      { x: 465, y: 286 },
      { x: 426, y: 309 },
      { x: 386, y: 278 },
    ],
  },
  {
    id: 'bookshelf',
    polygon: [
      { x: 514, y: 193 },
      { x: 573, y: 169 },
      { x: 612, y: 190 },
      { x: 611, y: 274 },
      { x: 558, y: 298 },
      { x: 516, y: 273 },
    ],
  },
  {
    id: 'shower-door-front',
    polygon: [
      { x: 608, y: 250 },
      { x: 655, y: 230 },
      { x: 693, y: 251 },
      { x: 693, y: 306 },
      { x: 650, y: 330 },
      { x: 608, y: 307 },
    ],
  },
  {
    id: 'center-table',
    polygon: [
      { x: 297, y: 326 },
      { x: 369, y: 296 },
      { x: 473, y: 340 },
      { x: 397, y: 396 },
      { x: 334, y: 368 },
    ],
  },
];
