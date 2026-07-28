import {
  ISOMETRIC_CHARACTER_COLLISION_RADIUS,
  ISOMETRIC_MOVEMENT_OBSTACLES,
  ISOMETRIC_WALKABLE_POLYGON,
} from '../constants/isometricMovementLayout';
import type {
  IsometricCharacterPosition,
  IsometricObstacle,
  IsometricPoint,
} from '../types/isometricRoom';

const COLLISION_SAMPLE_COUNT = 16;

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

function createCollisionSamplePoints(position: IsometricCharacterPosition) {
  const points: IsometricPoint[] = [];

  for (let index = 0; index < COLLISION_SAMPLE_COUNT; index += 1) {
    const angle = (Math.PI * 2 * index) / COLLISION_SAMPLE_COUNT;
    points.push({
      x: position.x + (
        Math.cos(angle) * ISOMETRIC_CHARACTER_COLLISION_RADIUS.horizontal
      ),
      y: position.y + (
        Math.sin(angle) * ISOMETRIC_CHARACTER_COLLISION_RADIUS.vertical
      ),
    });
  }

  return points;
}

export function isCircleInsideWalkableArea(
  position: IsometricCharacterPosition,
  walkablePolygon = ISOMETRIC_WALKABLE_POLYGON,
) {
  return createCollisionSamplePoints(position).every(
    (point) => isPointInsidePolygon(point, walkablePolygon),
  );
}

function isPointInsideCharacterCollision(
  point: IsometricPoint,
  position: IsometricCharacterPosition,
) {
  const normalizedX = (
    point.x - position.x
  ) / ISOMETRIC_CHARACTER_COLLISION_RADIUS.horizontal;
  const normalizedY = (
    point.y - position.y
  ) / ISOMETRIC_CHARACTER_COLLISION_RADIUS.vertical;

  return (normalizedX * normalizedX) + (normalizedY * normalizedY) <= 1;
}

export function doesCharacterIntersectObstacle(
  position: IsometricCharacterPosition,
  obstacle: IsometricObstacle,
) {
  if (isPointInsidePolygon(position, obstacle.polygon)) {
    return true;
  }

  if (createCollisionSamplePoints(position).some(
    (point) => isPointInsidePolygon(point, obstacle.polygon),
  )) {
    return true;
  }

  return obstacle.polygon.some(
    (point) => isPointInsideCharacterCollision(point, position),
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

  return !ISOMETRIC_MOVEMENT_OBSTACLES.some(
    (obstacle) => doesCharacterIntersectObstacle(position, obstacle),
  );
}

export function isTapPointOnWalkableFloor(point: IsometricPoint) {
  if (!isPointInsidePolygon(point, ISOMETRIC_WALKABLE_POLYGON)) {
    return false;
  }

  return !ISOMETRIC_MOVEMENT_OBSTACLES.some(
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
