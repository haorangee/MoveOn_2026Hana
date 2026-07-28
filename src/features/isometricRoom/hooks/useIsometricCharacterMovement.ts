import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_ISOMETRIC_CHARACTER_POSITION,
  ISOMETRIC_CHARACTER_POSITION_STORAGE_KEY,
  ISOMETRIC_CHARACTER_POSITION_STORAGE_VERSION,
  ISOMETRIC_CONTINUOUS_MOVE_INTERVAL_MS,
  ISOMETRIC_MOVEMENT_VECTORS,
  ISOMETRIC_POSITION_SAVE_DEBOUNCE_MS,
  ISOMETRIC_STEP_ANIMATION_MS,
} from '../constants/isometricMovementLayout';
import type {
  IsometricCharacterFacingDirection,
  IsometricCharacterPosition,
  IsometricMovementDirection,
} from '../types/isometricRoom';
import {
  getValidCharacterPosition,
  isIsometricCharacterPositionValid,
  isTapPointOnWalkableFloor,
} from '../utils/isometricMovementCollision';

type StoredIsometricCharacterPosition = IsometricCharacterPosition & {
  version: typeof ISOMETRIC_CHARACTER_POSITION_STORAGE_VERSION;
};

function parseStoredPosition(value: string | null) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredIsometricCharacterPosition>;
    const position = {
      x: Number(parsed.x),
      y: Number(parsed.y),
    };

    if (
      parsed.version !== ISOMETRIC_CHARACTER_POSITION_STORAGE_VERSION
      || !isIsometricCharacterPositionValid(position)
    ) {
      return null;
    }

    return position;
  } catch {
    return null;
  }
}

async function persistPosition(position: IsometricCharacterPosition) {
  const storedPosition: StoredIsometricCharacterPosition = {
    version: ISOMETRIC_CHARACTER_POSITION_STORAGE_VERSION,
    x: position.x,
    y: position.y,
  };

  await AsyncStorage.setItem(
    ISOMETRIC_CHARACTER_POSITION_STORAGE_KEY,
    JSON.stringify(storedPosition),
  );
}

export function useIsometricCharacterMovement() {
  const [position, setPosition] = useState<IsometricCharacterPosition>(
    DEFAULT_ISOMETRIC_CHARACTER_POSITION,
  );
  const [facingDirection, setFacingDirection] =
    useState<IsometricCharacterFacingDirection>('right');
  const [isMoving, setIsMoving] = useState(false);
  const positionRef = useRef(position);
  const mountedRef = useRef(true);
  const hydratedRef = useRef(false);
  const continuousMoveTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(null);
  const movementStopTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMovementStopTimer = useCallback(() => {
    if (!movementStopTimerRef.current) return;
    clearTimeout(movementStopTimerRef.current);
    movementStopTimerRef.current = null;
  }, []);

  const stopMoving = useCallback(() => {
    if (continuousMoveTimerRef.current) {
      clearInterval(continuousMoveTimerRef.current);
      continuousMoveTimerRef.current = null;
    }
    clearMovementStopTimer();
    if (mountedRef.current) {
      setIsMoving(false);
    }
  }, [clearMovementStopTimer]);

  const applyMovementStep = useCallback((
    direction: IsometricMovementDirection,
    keepMoving: boolean,
  ) => {
    if (direction === 'left' || direction === 'right') {
      setFacingDirection(direction);
    }

    const vector = ISOMETRIC_MOVEMENT_VECTORS[direction];
    const currentPosition = positionRef.current;
    const requestedPosition = {
      x: currentPosition.x + vector.dx,
      y: currentPosition.y + vector.dy,
    };
    const validPosition = getValidCharacterPosition(
      currentPosition,
      requestedPosition,
    );
    const didMove = (
      validPosition.x !== currentPosition.x
      || validPosition.y !== currentPosition.y
    );

    if (didMove) {
      positionRef.current = validPosition;
      setPosition(validPosition);
    }

    if (mountedRef.current) {
      setIsMoving(didMove && keepMoving);
    }

    return didMove;
  }, []);

  const moveOneStep = useCallback((direction: IsometricMovementDirection) => {
    stopMoving();
    const didMove = applyMovementStep(direction, true);
    if (!didMove) return;

    movementStopTimerRef.current = setTimeout(() => {
      movementStopTimerRef.current = null;
      if (mountedRef.current) {
        setIsMoving(false);
      }
    }, ISOMETRIC_STEP_ANIMATION_MS + 30);
  }, [applyMovementStep, stopMoving]);

  const startMoving = useCallback((direction: IsometricMovementDirection) => {
    stopMoving();
    applyMovementStep(direction, true);

    continuousMoveTimerRef.current = setInterval(() => {
      applyMovementStep(direction, true);
    }, ISOMETRIC_CONTINUOUS_MOVE_INTERVAL_MS);
  }, [applyMovementStep, stopMoving]);

  const moveTowardPoint = useCallback((target: IsometricCharacterPosition) => {
    if (!isTapPointOnWalkableFloor(target)) return;

    const currentPosition = positionRef.current;
    const deltaX = target.x - currentPosition.x;
    const deltaY = target.y - currentPosition.y;

    if (Math.abs(deltaX) <= 18 && Math.abs(deltaY) <= 12) {
      return;
    }

    const direction: IsometricMovementDirection = Math.abs(deltaX) > Math.abs(deltaY)
      ? (deltaX > 0 ? 'right' : 'left')
      : (deltaY > 0 ? 'down' : 'up');

    moveOneStep(direction);
  }, [moveOneStep]);

  const resetPosition = useCallback(() => {
    stopMoving();
    const defaultPosition = { ...DEFAULT_ISOMETRIC_CHARACTER_POSITION };
    positionRef.current = defaultPosition;
    setPosition(defaultPosition);
    setFacingDirection('right');
  }, [stopMoving]);

  useEffect(() => {
    let active = true;

    async function restorePosition() {
      try {
        const savedValue = await AsyncStorage.getItem(
          ISOMETRIC_CHARACTER_POSITION_STORAGE_KEY,
        );
        const savedPosition = parseStoredPosition(savedValue);
        if (!active || !savedPosition) return;

        positionRef.current = savedPosition;
        setPosition(savedPosition);
      } catch (error) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('Failed to restore isometric character position.', error);
        }
      } finally {
        if (active) {
          hydratedRef.current = true;
        }
      }
    }

    void restorePosition();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    positionRef.current = position;
    if (!hydratedRef.current) return undefined;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      void persistPosition(position).catch((error: unknown) => {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('Failed to save isometric character position.', error);
        }
      });
    }, ISOMETRIC_POSITION_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [position]);

  useEffect(() => () => {
    mountedRef.current = false;
    if (continuousMoveTimerRef.current) {
      clearInterval(continuousMoveTimerRef.current);
      continuousMoveTimerRef.current = null;
    }
    if (movementStopTimerRef.current) {
      clearTimeout(movementStopTimerRef.current);
      movementStopTimerRef.current = null;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (hydratedRef.current) {
      void persistPosition(positionRef.current).catch((error: unknown) => {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('Failed to save final isometric character position.', error);
        }
      });
    }
  }, []);

  return {
    position,
    facingDirection,
    isMoving,
    moveOneStep,
    startMoving,
    stopMoving,
    moveTowardPoint,
    resetPosition,
  };
}
