import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { RoomHotspot } from '@/features/home/roomData';

type InteractiveRoomObjectProps = {
  object: RoomHotspot;
  debug?: boolean;
  onPress: (object: RoomHotspot) => void;
};

export function InteractiveRoomObject({
  object,
  debug = false,
  onPress,
}: InteractiveRoomObjectProps) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${object.title} 열기`}
        onPress={() => onPress(object)}
        style={({ pressed }) => [
          styles.hotspot,
          object.frame,
          debug && styles.debugHotspot,
          pressed && styles.pressed,
        ]}
      />
      <View pointerEvents="none" style={[styles.marker, object.marker]}>
        <Ionicons name={object.icon} size={13} color="#514638" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hotspot: {
    position: 'absolute',
    borderRadius: 18,
  },
  debugHotspot: {
    borderWidth: 1,
    borderColor: 'rgba(210, 78, 59, 0.9)',
    backgroundColor: 'rgba(210, 78, 59, 0.14)',
  },
  pressed: {
    backgroundColor: 'rgba(255, 244, 202, 0.24)',
    transform: [{ scale: 0.98 }],
  },
  marker: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 252, 244, 0.87)',
    borderWidth: 1,
    borderColor: 'rgba(74, 62, 48, 0.28)',
    shadowColor: '#3D3428',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
});
