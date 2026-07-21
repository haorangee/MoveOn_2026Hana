import { Pressable, StyleSheet } from 'react-native';
import type { RoomHotspot } from '@/features/home/roomData';

type InteractiveRoomObjectProps = {
  object: RoomHotspot;
  disabled?: boolean;
  onPress: (object: RoomHotspot) => void;
};

export function InteractiveRoomObject({
  object,
  disabled = false,
  onPress,
}: InteractiveRoomObjectProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${object.title} 사용하기`}
      accessibilityHint={`${object.actionLabel} 기능으로 이동합니다.`}
      disabled={disabled}
      onPress={() => onPress(object)}
      style={({ pressed }) => [
        styles.hotspot,
        object.frame,
        pressed && styles.pressed,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  hotspot: {
    position: 'absolute',
    borderRadius: 20,
  },
  pressed: {
    backgroundColor: 'rgba(255, 239, 183, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 246, 213, 0.28)',
  },
});
