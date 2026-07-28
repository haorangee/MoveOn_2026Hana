import { Pressable, StyleSheet } from 'react-native';
import type { IsometricCharacterPosition } from '../types/isometricRoom';

type IsometricMovementTapSurfaceProps = {
  disabled?: boolean;
  onPressFloor: (position: IsometricCharacterPosition) => void;
};

export function IsometricMovementTapSurface({
  disabled = false,
  onPressFloor,
}: IsometricMovementTapSurfaceProps) {
  return (
    <Pressable
      accessibilityHint="빈 바닥을 누르면 캐릭터가 해당 방향으로 한 걸음 이동해요."
      accessibilityLabel="방 바닥에서 캐릭터 이동"
      accessibilityRole="button"
      disabled={disabled}
      onPress={(event) => {
        onPressFloor({
          x: event.nativeEvent.locationX,
          y: event.nativeEvent.locationY,
        });
      }}
      style={styles.surface}
    />
  );
}

const styles = StyleSheet.create({
  surface: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
