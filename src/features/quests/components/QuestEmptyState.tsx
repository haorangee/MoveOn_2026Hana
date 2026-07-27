import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type QuestEmptyStateProps = {
  disabled?: boolean;
  onCreatePress: () => void;
};

export function QuestEmptyState({
  disabled = false,
  onCreatePress,
}: QuestEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.pinRow}>
        <View style={styles.pin} />
        <View style={styles.pin} />
      </View>
      <View style={styles.paper}>
        <View style={styles.tape} />
        <Ionicons color="#C99CA7" name="document-text-outline" size={34} />
        <Text style={styles.title}>오늘의 메모가 아직 비어 있어요</Text>
        <Text style={styles.description}>
          아주 작은 행동 하나부터 적어 볼까요? 방 한쪽에 붙인 포스트잇처럼 가볍게 시작해요.
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onCreatePress}
          style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
        >
          <Text style={styles.buttonText}>첫 퀘스트 만들기</Text>
          <Ionicons color="#FFF9F1" name="add" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    padding: 18,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EAD4DD',
    backgroundColor: '#FFDDE7',
    shadowColor: '#805A66',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  pinRow: {
    position: 'absolute',
    top: 12,
    left: 24,
    right: 24,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pin: {
    width: 13,
    height: 13,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFF7EB',
    backgroundColor: '#8FB8D8',
  },
  paper: {
    minHeight: 230,
    paddingHorizontal: 22,
    paddingTop: 38,
    paddingBottom: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1DEC2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9E9',
  },
  tape: {
    position: 'absolute',
    top: -10,
    width: 84,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(196, 223, 240, 0.72)',
    transform: [{ rotate: '-2deg' }],
  },
  title: {
    marginTop: 13,
    color: '#4A3D35',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    marginTop: 9,
    color: '#806F62',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    minHeight: 48,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#D48A9A',
  },
  buttonText: {
    color: '#FFF9F1',
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
