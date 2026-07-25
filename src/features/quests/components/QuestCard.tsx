import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ACTIVITY_CATEGORY } from '../../activity/constants/activityCategory';
import type { Quest, QuestCategory, QuestDifficulty } from '../../../contracts/quest';
import { QuestStatusBadge } from './QuestStatusBadge';

type QuestCardProps = {
  disabled?: boolean;
  isProcessing?: boolean;
  quest: Quest;
  onCompleteCustom: (quest: Quest) => void;
  onDelete: (quest: Quest) => void;
  onEdit: (quest: Quest) => void;
  onSkip: (quest: Quest) => void;
  onStartActivity: (quest: Quest) => void;
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_META: Record<QuestCategory, {
  color: string;
  icon: IconName;
  label: string;
}> = {
  [ACTIVITY_CATEGORY.STUDY]: {
    color: '#9BBFDA',
    icon: 'book-outline',
    label: '공부',
  },
  [ACTIVITY_CATEGORY.CLEANING]: {
    color: '#BFD59B',
    icon: 'sparkles-outline',
    label: '청소',
  },
  [ACTIVITY_CATEGORY.SHOWER]: {
    color: '#D1B8E8',
    icon: 'water-outline',
    label: '샤워',
  },
  [ACTIVITY_CATEGORY.WATER]: {
    color: '#A8D6E7',
    icon: 'cafe-outline',
    label: '물 마시기',
  },
  custom: {
    color: '#F2B9C6',
    icon: 'star-outline',
    label: '나만의 퀘스트',
  },
};

const DIFFICULTY_LABEL: Record<QuestDifficulty, string> = {
  easy: '가볍게',
  normal: '차근차근',
  hard: '도전하기',
};

function categoryLabel(quest: Quest) {
  if (quest.category === 'custom') {
    return quest.customCategoryLabel || CATEGORY_META.custom.label;
  }
  return CATEGORY_META[quest.category].label;
}

export function QuestCard({
  disabled = false,
  isProcessing = false,
  quest,
  onCompleteCustom,
  onDelete,
  onEdit,
  onSkip,
  onStartActivity,
}: QuestCardProps) {
  const meta = CATEGORY_META[quest.category];
  const isPending = quest.status === 'pending';
  const isCompleted = quest.status === 'completed';
  const isSkipped = quest.status === 'skipped';
  const isCustom = quest.category === 'custom';
  const actionDisabled = disabled || isProcessing;

  return (
    <View style={[
      styles.card,
      isCompleted && styles.completedCard,
      isSkipped && styles.skippedCard,
    ]}>
      <View pointerEvents="none" style={[styles.tape, { backgroundColor: meta.color }]} />
      <View style={styles.cardHeader}>
        <View style={[styles.categorySticker, { backgroundColor: meta.color }]}>
          <Ionicons color="#5A4A40" name={meta.icon} size={15} />
          <Text style={styles.categoryText}>{categoryLabel(quest)}</Text>
        </View>
        <QuestStatusBadge status={quest.status} />
      </View>

      <View style={styles.titleRow}>
        <Text style={[styles.title, isCompleted && styles.completedText]}>{quest.title}</Text>
        {isCompleted ? (
          <View style={styles.stamp}>
            <Ionicons color="#6F8A56" name="checkmark" size={16} />
          </View>
        ) : null}
      </View>

      {quest.description ? (
        <Text style={styles.description}>{quest.description}</Text>
      ) : (
        <Text style={styles.placeholder}>작은 메모가 비어 있어요.</Text>
      )}

      {quest.recommendationReason ? (
        <View style={styles.reasonNote}>
          <Ionicons color="#A87B8B" name="sparkles-outline" size={13} />
          <Text style={styles.reasonText}>{quest.recommendationReason}</Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons color="#7E7166" name="time-outline" size={13} />
          <Text style={styles.metaText}>{quest.estimatedMinutes}분</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons color="#7E7166" name="flag-outline" size={13} />
          <Text style={styles.metaText}>{DIFFICULTY_LABEL[quest.difficulty]}</Text>
        </View>
      </View>

      {isPending ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={actionDisabled}
            onPress={() => (isCustom ? onCompleteCustom(quest) : onStartActivity(quest))}
            style={({ pressed }) => [
              styles.primaryAction,
              isCustom ? styles.completeAction : styles.startAction,
              pressed && styles.pressed,
              actionDisabled && styles.disabled,
            ]}
          >
            <Ionicons
              color="#FFF9EF"
              name={isCustom ? 'checkmark-done' : 'play'}
              size={16}
            />
            <Text style={styles.primaryActionText}>
              {isCustom ? '완료했어요' : '시작하기'}
            </Text>
          </Pressable>

          <View style={styles.secondaryActions}>
            <Pressable
              accessibilityRole="button"
              disabled={actionDisabled}
              onPress={() => onEdit(quest)}
              style={({ pressed }) => [styles.textButton, pressed && styles.pressed, actionDisabled && styles.disabled]}
            >
              <Text style={styles.textButtonText}>고치기</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={actionDisabled}
              onPress={() => onSkip(quest)}
              style={({ pressed }) => [styles.textButton, pressed && styles.pressed, actionDisabled && styles.disabled]}
            >
              <Text style={styles.textButtonText}>쉬어가기</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={actionDisabled}
              onPress={() => onDelete(quest)}
              style={({ pressed }) => [styles.textButton, pressed && styles.pressed, actionDisabled && styles.disabled]}
            >
              <Text style={[styles.textButtonText, styles.deleteText]}>삭제</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {isSkipped ? (
        <View style={styles.skippedActions}>
          <Text style={styles.skippedCopy}>오늘은 이 메모를 잠시 쉬어가요.</Text>
          <Pressable
            accessibilityRole="button"
            disabled={actionDisabled}
            onPress={() => onDelete(quest)}
            style={({ pressed }) => [styles.deletePill, pressed && styles.pressed, actionDisabled && styles.disabled]}
          >
            <Text style={styles.deletePillText}>메모 없애기</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 13,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ECDDC4',
    backgroundColor: '#FFF8E7',
    shadowColor: '#8C6671',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  completedCard: {
    backgroundColor: '#F8F7E2',
    borderColor: '#D9E6C6',
  },
  skippedCard: {
    backgroundColor: '#F5EEE7',
    borderColor: '#DDD0C3',
  },
  tape: {
    position: 'absolute',
    top: -7,
    left: 28,
    width: 58,
    height: 18,
    borderRadius: 6,
    opacity: 0.5,
    transform: [{ rotate: '-2deg' }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  categorySticker: {
    maxWidth: '58%',
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    flexShrink: 1,
    color: '#5A4A40',
    fontSize: 11,
    fontWeight: '900',
  },
  titleRow: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    flex: 1,
    color: '#3F342D',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  completedText: {
    color: '#516D45',
  },
  stamp: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#91AD78',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F6D9',
    transform: [{ rotate: '-8deg' }],
  },
  description: {
    marginTop: 8,
    color: '#76675A',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  placeholder: {
    marginTop: 8,
    color: '#B39D8C',
    fontSize: 12,
    fontStyle: 'italic',
  },
  reasonNote: {
    marginTop: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8CED7',
    flexDirection: 'row',
    gap: 7,
    backgroundColor: '#FFF1F5',
  },
  reasonText: {
    flex: 1,
    color: '#8A6471',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  metaRow: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5D5C0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  metaText: {
    color: '#7E7166',
    fontSize: 10,
    fontWeight: '900',
  },
  actions: {
    marginTop: 15,
    gap: 10,
  },
  primaryAction: {
    minHeight: 46,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  completeAction: {
    backgroundColor: '#7FA66A',
  },
  startAction: {
    backgroundColor: '#8AAED0',
  },
  primaryActionText: {
    color: '#FFF9EF',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  textButton: {
    minHeight: 30,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  textButtonText: {
    color: '#7B6B5D',
    fontSize: 11,
    fontWeight: '900',
  },
  deleteText: {
    color: '#A96363',
  },
  skippedActions: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  skippedCopy: {
    flex: 1,
    color: '#8A796B',
    fontSize: 12,
    fontWeight: '700',
  },
  deletePill: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E1C7C4',
    justifyContent: 'center',
    backgroundColor: '#FFF7F4',
  },
  deletePillText: {
    color: '#9A5E5B',
    fontSize: 11,
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
