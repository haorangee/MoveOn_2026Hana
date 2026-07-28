import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useEffect, useRef } from 'react';
import type { IsometricMovementDirection } from '../types/isometricRoom';

const LONG_PRESS_DELAY_MS = 220;

type IsometricMovementControlsProps = {
  disabled?: boolean;
  onMove: (direction: IsometricMovementDirection) => void;
  onStartMove: (direction: IsometricMovementDirection) => void;
  onStopMove: () => void;
  style?: StyleProp<ViewStyle>;
};

type DirectionButtonProps = {
  accessibilityLabel: string;
  direction: IsometricMovementDirection;
  disabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  onMove: (direction: IsometricMovementDirection) => void;
  onStartMove: (direction: IsometricMovementDirection) => void;
  onStopMove: () => void;
  style: ViewStyle;
};

export function IsometricMovementControls({
  disabled = false,
  onMove,
  onStartMove,
  onStopMove,
  style,
}: IsometricMovementControlsProps) {
  return (
    <View
      accessibilityLabel="캐릭터 이동 조작기"
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <DirectionButton
        accessibilityLabel="캐릭터를 위로 이동"
        direction="up"
        disabled={disabled}
        icon="chevron-up"
        onMove={onMove}
        onStartMove={onStartMove}
        onStopMove={onStopMove}
        style={styles.upButton}
      />
      <DirectionButton
        accessibilityLabel="캐릭터를 왼쪽으로 이동"
        direction="left"
        disabled={disabled}
        icon="chevron-back"
        onMove={onMove}
        onStartMove={onStartMove}
        onStopMove={onStopMove}
        style={styles.leftButton}
      />
      <View pointerEvents="none" style={styles.centerButton}>
        <Text style={styles.centerText}>이동</Text>
      </View>
      <DirectionButton
        accessibilityLabel="캐릭터를 오른쪽으로 이동"
        direction="right"
        disabled={disabled}
        icon="chevron-forward"
        onMove={onMove}
        onStartMove={onStartMove}
        onStopMove={onStopMove}
        style={styles.rightButton}
      />
      <DirectionButton
        accessibilityLabel="캐릭터를 아래로 이동"
        direction="down"
        disabled={disabled}
        icon="chevron-down"
        onMove={onMove}
        onStartMove={onStartMove}
        onStopMove={onStopMove}
        style={styles.downButton}
      />
    </View>
  );
}

function DirectionButton({
  accessibilityLabel,
  direction,
  disabled,
  icon,
  onMove,
  onStartMove,
  onStopMove,
  style,
}: DirectionButtonProps) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didStartContinuousMoveRef = useRef(false);

  const clearLongPressTimer = () => {
    if (!longPressTimerRef.current) return;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  useEffect(() => () => {
    clearLongPressTimer();
  }, []);

  useEffect(() => {
    if (!disabled) return;
    clearLongPressTimer();
    didStartContinuousMoveRef.current = false;
    onStopMove();
  }, [disabled, onStopMove]);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        if (!didStartContinuousMoveRef.current) {
          onMove(direction);
        }
        didStartContinuousMoveRef.current = false;
      }}
      onPressIn={() => {
        if (disabled) return;
        clearLongPressTimer();
        didStartContinuousMoveRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
          longPressTimerRef.current = null;
          didStartContinuousMoveRef.current = true;
          onStartMove(direction);
        }, LONG_PRESS_DELAY_MS);
      }}
      onPressOut={() => {
        clearLongPressTimer();
        onStopMove();
      }}
      style={({ pressed }) => [
        styles.directionButton,
        style,
        pressed && styles.directionButtonPressed,
      ]}
    >
      <Ionicons color="#6E5A49" name={icon} size={27} />
    </Pressable>
  );
}

const BUTTON_SIZE = 50;

const styles = StyleSheet.create({
  container: {
    width: 164,
    height: 158,
    alignSelf: 'center',
    borderRadius: 52,
    borderWidth: 1,
    borderColor: 'rgba(149, 126, 101, 0.18)',
    backgroundColor: 'rgba(255, 251, 242, 0.92)',
    shadowColor: '#5D4939',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 5,
  },
  disabled: {
    opacity: 0.46,
  },
  directionButton: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(135, 109, 83, 0.18)',
    backgroundColor: '#F2E7D6',
  },
  directionButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.92 }],
    backgroundColor: '#E7D6BF',
  },
  upButton: {
    left: 57,
    top: 2,
  },
  leftButton: {
    left: 3,
    top: 54,
  },
  rightButton: {
    right: 3,
    top: 54,
  },
  downButton: {
    left: 57,
    bottom: 2,
  },
  centerButton: {
    position: 'absolute',
    left: 57,
    top: 54,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7D8D62',
  },
  centerText: {
    color: '#FFF9EF',
    fontSize: 11,
    fontWeight: '900',
  },
});
