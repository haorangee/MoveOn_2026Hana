import { StyleSheet, Text, View } from 'react-native';
import type { QuestStatus } from '../../../contracts/quest';

type QuestStatusBadgeProps = {
  status: QuestStatus;
};

const STATUS_COPY: Record<QuestStatus, string> = {
  pending: '아직 시작 전',
  completed: '완료 도장',
  skipped: '오늘은 쉬어가기',
};

export function QuestStatusBadge({ status }: QuestStatusBadgeProps) {
  return (
    <View style={[styles.badge, styles[status]]}>
      <Text style={[styles.text, styles[`${status}Text`]]}>{STATUS_COPY[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 27,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pending: {
    borderColor: '#E8D3A9',
    backgroundColor: '#FFF3CF',
  },
  completed: {
    borderColor: '#A6C38F',
    backgroundColor: '#E5F2D9',
  },
  skipped: {
    borderColor: '#D6C7BB',
    backgroundColor: '#F2E9E0',
  },
  text: {
    fontSize: 10,
    fontWeight: '900',
  },
  pendingText: { color: '#9A7437' },
  completedText: { color: '#5B7E49' },
  skippedText: { color: '#806D5E' },
});
