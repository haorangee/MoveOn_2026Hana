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
      focusable={false}
      disabled={disabled}
      onPress={() => onPress(object)}
      style={[styles.hotspot, object.frame]}
    />
  );
}

const styles = StyleSheet.create({
  hotspot: {
    position: 'absolute',
    borderRadius: 20,
    outlineStyle: 'none' as never,
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
});
