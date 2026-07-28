import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  ISOMETRIC_JOYSTICK_BASE_SIZE,
  ISOMETRIC_JOYSTICK_DEAD_ZONE,
  ISOMETRIC_JOYSTICK_KNOB_SIZE,
  ISOMETRIC_JOYSTICK_MAX_RADIUS,
} from '../constants/isometricMovementLayout';
import type { IsometricJoystickInput } from '../types/isometricRoom';

type IsometricMovementControlsProps = {
  disabled?: boolean;
  onChange: (input: IsometricJoystickInput) => void;
  onRelease: () => void;
  style?: StyleProp<ViewStyle>;
};

export function IsometricMovementControls({
  disabled = false,
  onChange,
  onRelease,
  style,
}: IsometricMovementControlsProps) {
  const knobPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const resetJoystick = useCallback(() => {
    onRelease();
    knobPosition.stopAnimation();
    Animated.spring(knobPosition, {
      toValue: { x: 0, y: 0 },
      damping: 17,
      stiffness: 230,
      mass: 0.7,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [knobPosition, onRelease]);

  const updateJoystick = useCallback((rawDx: number, rawDy: number) => {
    const rawDistance = Math.hypot(rawDx, rawDy);
    const clampScale = rawDistance > ISOMETRIC_JOYSTICK_MAX_RADIUS
      ? ISOMETRIC_JOYSTICK_MAX_RADIUS / rawDistance
      : 1;
    const dx = rawDx * clampScale;
    const dy = rawDy * clampScale;
    const distance = Math.min(rawDistance, ISOMETRIC_JOYSTICK_MAX_RADIUS);

    knobPosition.setValue({ x: dx, y: dy });

    if (distance < ISOMETRIC_JOYSTICK_DEAD_ZONE) {
      onChange({ x: 0, y: 0, strength: 0 });
      return;
    }

    const strength = Math.min(
      1,
      (distance - ISOMETRIC_JOYSTICK_DEAD_ZONE)
      / (ISOMETRIC_JOYSTICK_MAX_RADIUS - ISOMETRIC_JOYSTICK_DEAD_ZONE),
    );
    const directionLength = Math.hypot(dx, dy);
    onChange({
      x: directionLength > Number.EPSILON ? dx / directionLength : 0,
      y: directionLength > Number.EPSILON ? dy / directionLength : 0,
      strength,
    });
  }, [knobPosition, onChange]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => {
      knobPosition.stopAnimation();
      updateJoystick(0, 0);
    },
    onPanResponderMove: (_event, gestureState) => {
      if (disabled) return;
      updateJoystick(gestureState.dx, gestureState.dy);
    },
    onPanResponderRelease: resetJoystick,
    onPanResponderTerminate: resetJoystick,
    onPanResponderTerminationRequest: () => true,
  }), [
    disabled,
    knobPosition,
    resetJoystick,
    updateJoystick,
  ]);

  useEffect(() => {
    if (disabled) {
      resetJoystick();
    }
  }, [disabled, resetJoystick]);

  useEffect(() => () => {
    knobPosition.stopAnimation();
  }, [knobPosition]);

  return (
    <View
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <View
        {...panResponder.panHandlers}
        accessibilityLabel="캐릭터 아날로그 조이스틱"
        accessibilityRole="adjustable"
        accessibilityState={{ disabled }}
        pointerEvents={disabled ? 'none' : 'auto'}
        style={styles.base}
        testID="isometric-joystick-base"
      >
        <View pointerEvents="none" style={styles.innerRing} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.knob,
            {
              transform: [
                { translateX: knobPosition.x },
                { translateY: knobPosition.y },
              ],
            },
          ]}
        >
          <View style={styles.knobHighlight} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ISOMETRIC_JOYSTICK_BASE_SIZE + 12,
    height: ISOMETRIC_JOYSTICK_BASE_SIZE + 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.42,
  },
  base: {
    width: ISOMETRIC_JOYSTICK_BASE_SIZE,
    height: ISOMETRIC_JOYSTICK_BASE_SIZE,
    borderRadius: ISOMETRIC_JOYSTICK_BASE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(132, 111, 87, 0.22)',
    backgroundColor: 'rgba(249, 241, 228, 0.96)',
    shadowColor: '#5D4939',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.16,
    shadowRadius: 13,
    elevation: 6,
  },
  innerRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(138, 116, 91, 0.13)',
    backgroundColor: 'rgba(228, 215, 197, 0.3)',
  },
  knob: {
    width: ISOMETRIC_JOYSTICK_KNOB_SIZE,
    height: ISOMETRIC_JOYSTICK_KNOB_SIZE,
    borderRadius: ISOMETRIC_JOYSTICK_KNOB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 82, 64, 0.22)',
    backgroundColor: '#8A7764',
    shadowColor: '#4C3C30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 5,
  },
  knobHighlight: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 248, 235, 0.22)',
  },
});
