import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { RoomObject } from '@/features/home/roomData';

type ObjectInteractionSheetProps = {
  object: RoomObject | null;
  onClose: () => void;
  onPrimaryAction: () => void;
};

export function ObjectInteractionSheet({
  object,
  onClose,
  onPrimaryAction,
}: ObjectInteractionSheetProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={object !== null}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.headingRow}>
            <View style={styles.icon}>
              <Ionicons
                name={object?.icon ?? 'sparkles-outline'}
                size={21}
                color="#665746"
              />
            </View>
            <View style={styles.copy}>
              <Text style={styles.eyebrow}>내 방의 작은 행동</Text>
              <Text style={styles.title}>{object?.title}</Text>
            </View>
            <Pressable accessibilityLabel="닫기" onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={20} color="#6C6257" />
            </Pressable>
          </View>
          <Text style={styles.description}>{object?.description}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onPrimaryAction}
            style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
          >
            <Text style={styles.primaryLabel}>{object?.actionLabel}</Text>
            {object?.route ? (
              <Ionicons name="arrow-forward" size={17} color="#FFFDF7" />
            ) : null}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(35, 29, 22, 0.18)',
  },
  sheet: {
    marginHorizontal: 12,
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 9,
    paddingBottom: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 252, 244, 0.98)',
    shadowColor: '#2C241B',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    marginBottom: 15,
    borderRadius: 2,
    backgroundColor: '#D9CDBD',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEE5D6',
  },
  copy: {
    flex: 1,
    marginLeft: 12,
  },
  eyebrow: {
    color: '#988570',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 2,
    color: '#362F27',
    fontSize: 20,
    fontWeight: '800',
  },
  close: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    marginTop: 15,
    marginBottom: 18,
    color: '#6E6255',
    fontSize: 14,
    lineHeight: 21,
  },
  primary: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#6E765A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  primaryLabel: {
    color: '#FFFDF7',
    fontSize: 15,
    fontWeight: '800',
  },
});
