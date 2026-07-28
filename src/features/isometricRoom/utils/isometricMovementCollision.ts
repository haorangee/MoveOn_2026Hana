import {
  ISOMETRIC_CHARACTER_COLLISION_RADIUS,
  ISOMETRIC_FIXED_MOVEMENT_OBSTACLES,
  ISOMETRIC_PET_CHARACTER_MIN_DISTANCE,
  ISOMETRIC_PET_COLLISION_RADIUS,
  ISOMETRIC_WALKABLE_POLYGON,
} from '../constants/isometricMovementLayout';
import type {
  IsometricCharacterPosition,
  IsometricMovementDirection,
  IsometricObstacle,
  IsometricPetPosition,
  IsometricPoint,
} from '../types/isometricRoom';

const COLLISION_SAMPLE_COUNT = 16;
const PET_ESCAPE_STEPS = [44, 28, 16, 10];

type CollisionRadius = {
  horizontal: number;
  vertical: number;
};

type EscapeVector = {
  dx: number;
  dy: number;
};

const PET_ESCAPE_VECTORS: Record<
  IsometricMovementDirection,
  EscapeVector[]
> = {
  up: [
    { dx: 0, dy: -1 },
    { dx: -0.72, dy: -1 },
    { dx: 0.72, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
  ],
  down: [
    { dx: 0, dy: 1 },
    { dx: -0.72, dy: 1 },
    { dx: 0.72, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
  ],
  left: [
    { dx: -1, dy: 0 },
    { dx: -1, dy: -0.72 },
    { dx: -1, dy: 0.72 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 0 },
  ],
  right: [
    { dx: 1, dy: 0 },
    { dx: 1, dy: -0.72 },
    { dx: 1, dy: 0.72 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ],
};

export function isPointInsidePolygon(
  point: IsometricPoint,
  polygon: IsometricPoint[],
) {
  let inside = false;

  for (let currentIndex = 0, previousIndex = polygon.length - 1;
    currentIndex < polygon.length;
    previousIndex = currentIndex, currentIndex += 1) {
    const current = polygon[currentIndex];
    const previous = polygon[previousIndex];
    const crossesHorizontalRay = (
      (current.y > point.y) !== (previous.y > point.y)
      && point.x < (
        ((previous.x - current.x) * (point.y - current.y))
        / (previous.y - current.y)
      ) + current.x
    );

    if (crossesHorizontalRay) {
      inside = !inside;
    }
  }

  return inside;
}

function createCollisionSamplePoints(
  position: IsometricPoint,
  radius: CollisionRadius,
) {
  const points: IsometricPoint[] = [];

  for (let index = 0; index < COLLISION_SAMPLE_COUNT; index += 1) {
    const angle = (Math.PI * 2 * index) / COLLISION_SAMPLE_COUNT;
    points.push({
      x: position.x + (
        Math.cos(angle) * radius.horizontal
      ),
      y: position.y + (
        Math.sin(angle) * radius.vertical
      ),
    });
  }

  return points;
}

function isEllipseInsideWalkableArea(
  position: IsometricPoint,
  radius: CollisionRadius,
  walkablePolygon = ISOMETRIC_WALKABLE_POLYGON,
) {
  return createCollisionSamplePoints(position, radius).every(
    (point) => isPointInsidePolygon(point, walkablePolygon),
  );
}

export function isCircleInsideWalkableArea(
  position: IsometricCharacterPosition,
  walkablePolygon = ISOMETRIC_WALKABLE_POLYGON,
) {
  return isEllipseInsideWalkableArea(
    position,
    ISOMETRIC_CHARACTER_COLLISION_RADIUS,
    walkablePolygon,
  );
}

function isPointInsideCollision(
  point: IsometricPoint,
  position: IsometricPoint,
  radius: CollisionRadius,
) {
  const normalizedX = (
    point.x - position.x
  ) / radius.horizontal;
  const normalizedY = (
    point.y - position.y
  ) / radius.vertical;

  return (normalizedX * normalizedX) + (normalizedY * normalizedY) <= 1;
}

function doesPositionIntersectObstacle(
  position: IsometricPoint,
  radius: CollisionRadius,
  obstacle: IsometricObstacle,
) {
  if (isPointInsidePolygon(position, obstacle.polygon)) {
    return true;
  }

  if (createCollisionSamplePoints(position, radius).some(
    (point) => isPointInsidePolygon(point, obstacle.polygon),
  )) {
    return true;
  }

  return obstacle.polygon.some(
    (point) => isPointInsideCollision(point, position, radius),
  );
}

export function doesCharacterIntersectObstacle(
  position: IsometricCharacterPosition,
  obstacle: IsometricObstacle,
) {
  return doesPositionIntersectObstacle(
    position,
    ISOMETRIC_CHARACTER_COLLISION_RADIUS,
    obstacle,
  );
}

export function isIsometricCharacterPositionValid(
  position: IsometricCharacterPosition,
) {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    return false;
  }

  if (!isCircleInsideWalkableArea(position)) {
    return false;
  }

  return !ISOMETRIC_FIXED_MOVEMENT_OBSTACLES.some(
    (obstacle) => doesCharacterIntersectObstacle(position, obstacle),
  );
}

export function getCharacterPetDistance(
  characterPosition: IsometricCharacterPosition,
  petPosition: IsometricPetPosition,
) {
  return Math.hypot(
    characterPosition.x - petPosition.x,
    characterPosition.y - petPosition.y,
  );
}

export function isCharacterTooCloseToPet(
  characterPosition: IsometricCharacterPosition,
  petPosition: IsometricPetPosition,
) {
  return getCharacterPetDistance(characterPosition, petPosition)
    < ISOMETRIC_PET_CHARACTER_MIN_DISTANCE;
}

export function isIsometricPetPositionValid(
  position: IsometricPetPosition,
  characterPosition?: IsometricCharacterPosition,
) {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    return false;
  }

  if (!isEllipseInsideWalkableArea(position, ISOMETRIC_PET_COLLISION_RADIUS)) {
    return false;
  }

  if (ISOMETRIC_FIXED_MOVEMENT_OBSTACLES.some(
    (obstacle) => doesPositionIntersectObstacle(
      position,
      ISOMETRIC_PET_COLLISION_RADIUS,
      obstacle,
    ),
  )) {
    return false;
  }

  return !characterPosition
    || !isCharacterTooCloseToPet(characterPosition, position);
}

export function findPetEscapePosition(
  petPosition: IsometricPetPosition,
  targetCharacterPosition: IsometricCharacterPosition,
  characterDirection: IsometricMovementDirection,
) {
  if (!isCharacterTooCloseToPet(targetCharacterPosition, petPosition)) {
    return petPosition;
  }

  const vectors = PET_ESCAPE_VECTORS[characterDirection];

  for (const step of PET_ESCAPE_STEPS) {
    for (const vector of vectors) {
      const candidate = {
        x: petPosition.x + vector.dx * step,
        y: petPosition.y + vector.dy * step,
      };

      if (isIsometricPetPositionValid(candidate, targetCharacterPosition)) {
        return candidate;
      }
    }
  }

  return null;
}

export function isTapPointOnWalkableFloor(point: IsometricPoint) {
  if (!isPointInsidePolygon(point, ISOMETRIC_WALKABLE_POLYGON)) {
    return false;
  }

  return !ISOMETRIC_FIXED_MOVEMENT_OBSTACLES.some(
    (obstacle) => isPointInsidePolygon(point, obstacle.polygon),
  );
}

export function getValidCharacterPosition(
  currentPosition: IsometricCharacterPosition,
  nextPosition: IsometricCharacterPosition,
) {
  return isIsometricCharacterPositionValid(nextPosition)
    ? nextPosition
    : currentPosition;
}
