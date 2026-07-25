import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IsometricRoomRect } from '../types/isometricRoom';

type RoomHotspotProps = {
  label: string;
  layout: IsometricRoomRect;
  onPress: () => void;
  disabled?: boolean;
  showDebug?: boolean;
};

export function RoomHotspot({
  disabled = false,
  label,
  layout,
  onPress,
  showDebug = false,
}: RoomHotspotProps) {
  return (
    <Pressable
      accessibilityHint={`${label} 기능을 확인합니다.`}
      accessibilityLabel={`${label} 터치 영역`}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.hotspot,
        {
          left: layout.x,
          top: layout.y,
          width: layout.width,
          height: layout.height,
        },
        showDebug && styles.debug,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {showDebug ? (
        <View pointerEvents="none" style={styles.debugLabel}>
          <Text style={styles.debugText}>{label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hotspot: {
    position: 'absolute',
    borderRadius: 18,
  },
  debug: {
    borderWidth: 1,
    borderColor: 'rgba(88, 112, 151, 0.62)',
    backgroundColor: 'rgba(108, 154, 213, 0.16)',
  },
  debugLabel: {
    alignSelf: 'flex-start',
    margin: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(54, 64, 83, 0.72)',
  },
  debugText: {
    color: '#FFF9EF',
    fontSize: 10,
    fontWeight: '800',
  },
  pressed: {
    backgroundColor: 'rgba(255, 244, 203, 0.24)',
  },
  disabled: {
    opacity: 0.42,
  },
});
