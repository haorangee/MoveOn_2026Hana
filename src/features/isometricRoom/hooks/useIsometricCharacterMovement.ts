import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_ISOMETRIC_CHARACTER_POSITION,
  DEFAULT_ISOMETRIC_PET_POSITION,
  ISOMETRIC_CHARACTER_POSITION_STORAGE_KEY,
  ISOMETRIC_CHARACTER_POSITION_STORAGE_VERSION,
  ISOMETRIC_COLLISION_SUBSTEP_SIZE,
  ISOMETRIC_FACING_HORIZONTAL_THRESHOLD,
  ISOMETRIC_MAX_FRAME_DELTA_SECONDS,
  ISOMETRIC_MAX_MOVEMENT_SPEED,
  ISOMETRIC_MIN_MOVEMENT_SPEED,
  ISOMETRIC_POSITION_SAVE_DEBOUNCE_MS,
  ISOMETRIC_TAP_MOVE_ANIMATION_MS,
  ISOMETRIC_TAP_MOVE_DISTANCE,
} from '../constants/isometricMovementLayout';
import type {
  IsometricCharacterFacingDirection,
  IsometricCharacterPosition,
  IsometricJoystickInput,
  IsometricMovementVector,
  IsometricPetPosition,
} from '../types/isometricRoom';
import {
  findPetEscapePosition,
  isIsometricCharacterPositionValid,
  isTapPointOnWalkableFloor,
  resolveIsometricCharacterMovement,
} from '../utils/isometricMovementCollision';

type StoredIsometricCharacterPosition = IsometricCharacterPosition & {
  version: typeof ISOMETRIC_CHARACTER_POSITION_STORAGE_VERSION;
};

const IDLE_JOYSTICK_INPUT: IsometricJoystickInput = {
  x: 0,
  y: 0,
  strength: 0,
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
  const [petPosition, setPetPosition] = useState<IsometricPetPosition>(
    DEFAULT_ISOMETRIC_PET_POSITION,
  );
  const [facingDirection, setFacingDirection] =
    useState<IsometricCharacterFacingDirection>('right');
  const [isMoving, setIsMoving] = useState(false);
  const positionRef = useRef(position);
  const petPositionRef = useRef(petPosition);
  const movementInputRef = useRef<IsometricJoystickInput>(IDLE_JOYSTICK_INPUT);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const hydratedRef = useRef(false);
  const movementStopTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMovementStopTimer = useCallback(() => {
    if (!movementStopTimerRef.current) return;
    clearTimeout(movementStopTimerRef.current);
    movementStopTimerRef.current = null;
  }, []);

  const updateFacingDirection = useCallback((horizontalVelocity: number) => {
    if (horizontalVelocity < -ISOMETRIC_FACING_HORIZONTAL_THRESHOLD) {
      setFacingDirection('left');
    } else if (horizontalVelocity > ISOMETRIC_FACING_HORIZONTAL_THRESHOLD) {
      setFacingDirection('right');
    }
  }, []);

  const stopMoving = useCallback(() => {
    movementInputRef.current = IDLE_JOYSTICK_INPUT;
    lastFrameTimeRef.current = null;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    clearMovementStopTimer();
    if (mountedRef.current) {
      setIsMoving(false);
    }
  }, [clearMovementStopTimer]);

  const applyMovementDelta = useCallback((
    movement: IsometricMovementVector,
    keepMoving: boolean,
  ) => {
    const totalDistance = Math.hypot(movement.dx, movement.dy);
    if (totalDistance <= Number.EPSILON) {
      if (mountedRef.current) {
        setIsMoving(false);
      }
      return false;
    }

    updateFacingDirection(movement.dx / totalDistance);

    const substepCount = Math.max(
      1,
      Math.ceil(totalDistance / ISOMETRIC_COLLISION_SUBSTEP_SIZE),
    );
    const substep = {
      dx: movement.dx / substepCount,
      dy: movement.dy / substepCount,
    };
    let nextCharacterPosition = positionRef.current;
    let nextPetPosition = petPositionRef.current;
    let didMove = false;

    for (let index = 0; index < substepCount; index += 1) {
      const candidateCharacterPosition = resolveIsometricCharacterMovement(
        nextCharacterPosition,
        substep,
      );
      const actualMovement = {
        dx: candidateCharacterPosition.x - nextCharacterPosition.x,
        dy: candidateCharacterPosition.y - nextCharacterPosition.y,
      };

      if (
        Math.abs(actualMovement.dx) <= Number.EPSILON
        && Math.abs(actualMovement.dy) <= Number.EPSILON
      ) {
        continue;
      }

      const escapedPetPosition = findPetEscapePosition(
        nextPetPosition,
        candidateCharacterPosition,
        actualMovement,
      );
      if (!escapedPetPosition) {
        continue;
      }

      nextCharacterPosition = candidateCharacterPosition;
      nextPetPosition = escapedPetPosition;
      didMove = true;
    }

    if (didMove && mountedRef.current) {
      if (
        nextPetPosition.x !== petPositionRef.current.x
        || nextPetPosition.y !== petPositionRef.current.y
      ) {
        petPositionRef.current = nextPetPosition;
        setPetPosition(nextPetPosition);
      }

      positionRef.current = nextCharacterPosition;
      setPosition(nextCharacterPosition);
    }

    if (mountedRef.current) {
      setIsMoving(didMove && keepMoving);
    }

    return didMove;
  }, [updateFacingDirection]);

  const runMovementFrame = useCallback(function movementFrame(
    timestamp: number,
  ) {
    const input = movementInputRef.current;
    if (input.strength <= 0 || !mountedRef.current) {
      animationFrameRef.current = null;
      lastFrameTimeRef.current = null;
      return;
    }

    const previousTimestamp = lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;

    if (previousTimestamp !== null) {
      const deltaSeconds = Math.min(
        ISOMETRIC_MAX_FRAME_DELTA_SECONDS,
        Math.max(0, (timestamp - previousTimestamp) / 1000),
      );
      const speed = ISOMETRIC_MIN_MOVEMENT_SPEED + (
        input.strength
        * (ISOMETRIC_MAX_MOVEMENT_SPEED - ISOMETRIC_MIN_MOVEMENT_SPEED)
      );

      applyMovementDelta({
        dx: input.x * speed * deltaSeconds,
        dy: input.y * speed * deltaSeconds,
      }, true);
    }

    animationFrameRef.current = requestAnimationFrame(movementFrame);
  }, [applyMovementDelta]);

  const setJoystickInput = useCallback((input: IsometricJoystickInput) => {
    clearMovementStopTimer();
    const strength = Math.min(1, Math.max(0, input.strength));
    const vectorLength = Math.hypot(input.x, input.y);

    if (strength <= 0 || vectorLength <= Number.EPSILON) {
      stopMoving();
      return;
    }

    movementInputRef.current = {
      x: input.x / vectorLength,
      y: input.y / vectorLength,
      strength,
    };
    updateFacingDirection(movementInputRef.current.x);

    if (animationFrameRef.current === null) {
      lastFrameTimeRef.current = null;
      setIsMoving(true);
      animationFrameRef.current = requestAnimationFrame(runMovementFrame);
    }
  }, [
    clearMovementStopTimer,
    runMovementFrame,
    stopMoving,
    updateFacingDirection,
  ]);

  const moveTowardPoint = useCallback((target: IsometricCharacterPosition) => {
    if (!isTapPointOnWalkableFloor(target)) return;

    stopMoving();
    const currentPosition = positionRef.current;
    const deltaX = target.x - currentPosition.x;
    const deltaY = target.y - currentPosition.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance <= ISOMETRIC_COLLISION_SUBSTEP_SIZE) {
      return;
    }

    const didMove = applyMovementDelta({
      dx: (deltaX / distance) * ISOMETRIC_TAP_MOVE_DISTANCE,
      dy: (deltaY / distance) * ISOMETRIC_TAP_MOVE_DISTANCE,
    }, true);
    if (!didMove) return;

    movementStopTimerRef.current = setTimeout(() => {
      movementStopTimerRef.current = null;
      if (mountedRef.current) {
        setIsMoving(false);
      }
    }, ISOMETRIC_TAP_MOVE_ANIMATION_MS);
  }, [applyMovementDelta, stopMoving]);

  const resetPosition = useCallback(() => {
    stopMoving();
    const defaultPosition = { ...DEFAULT_ISOMETRIC_CHARACTER_POSITION };
    positionRef.current = defaultPosition;
    const defaultPetPosition = { ...DEFAULT_ISOMETRIC_PET_POSITION };
    petPositionRef.current = defaultPetPosition;
    setPosition(defaultPosition);
    setPetPosition(defaultPetPosition);
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

        const restoredPetPosition = findPetEscapePosition(
          petPositionRef.current,
          savedPosition,
          { dx: 1, dy: 0 },
        );
        if (!restoredPetPosition) return;

        positionRef.current = savedPosition;
        petPositionRef.current = restoredPetPosition;
        setPosition(savedPosition);
        setPetPosition(restoredPetPosition);
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
    movementInputRef.current = IDLE_JOYSTICK_INPUT;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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
    petPosition,
    facingDirection,
    isMoving,
    setJoystickInput,
    stopMoving,
    moveTowardPoint,
    resetPosition,
  };
}
