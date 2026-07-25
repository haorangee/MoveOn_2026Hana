import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ACTIVITY_CATEGORY, type ActivityCategory } from '../../activity/constants/activityCategory';
import { createDateKey } from '../../activity/utils/dateKey';
import type { Quest, QuestCategory, QuestDifficulty } from '../../../contracts/quest';
import type { CreateQuestInput, UpdateQuestInput } from '../types/questInput';

type QuestFormMode = 'create' | 'edit';

type QuestFormModalProps = {
  isSubmitting?: boolean;
  mode: QuestFormMode;
  onClose: () => void;
  onSubmit: (input: CreateQuestInput | UpdateQuestInput) => Promise<void>;
  quest?: Quest | null;
  visible: boolean;
};

type CategoryOption = {
  label: string;
  value: QuestCategory;
};

type DifficultyOption = {
  label: string;
  value: QuestDifficulty;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { label: '공부', value: ACTIVITY_CATEGORY.STUDY },
  { label: '청소', value: ACTIVITY_CATEGORY.CLEANING },
  { label: '샤워', value: ACTIVITY_CATEGORY.SHOWER },
  { label: '물 마시기', value: ACTIVITY_CATEGORY.WATER },
  { label: '나만의 퀘스트', value: 'custom' },
];

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { label: '가볍게', value: 'easy' },
  { label: '차근차근', value: 'normal' },
  { label: '도전하기', value: 'hard' },
];

const QUICK_MINUTES = [5, 10, 15, 30, 60];

function rewardCategoryFor(category: QuestCategory): ActivityCategory | null {
  return category === 'custom' ? null : category;
}

function initialEstimatedMinutes(quest?: Quest | null) {
  return String(quest?.estimatedMinutes ?? 10);
}

export function QuestFormModal({
  isSubmitting = false,
  mode,
  onClose,
  onSubmit,
  quest,
  visible,
}: QuestFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>(ACTIVITY_CATEGORY.STUDY);
  const [customCategoryLabel, setCustomCategoryLabel] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('10');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('normal');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(quest?.title ?? '');
    setDescription(quest?.description ?? '');
    setCategory(quest?.category ?? ACTIVITY_CATEGORY.STUDY);
    setCustomCategoryLabel(quest?.customCategoryLabel ?? '');
    setEstimatedMinutes(initialEstimatedMinutes(quest));
    setDifficulty(quest?.difficulty ?? 'normal');
    setLocalError(null);
  }, [quest, visible]);

  const isCustom = category === 'custom';
  const titleText = mode === 'create' ? '작은 퀘스트 만들기' : '퀘스트 고치기';
  const submitText = mode === 'create' ? '메모 붙이기' : '고친 메모 붙이기';
  const minuteValue = useMemo(() => Number(estimatedMinutes), [estimatedMinutes]);

  const validate = () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedCustomLabel = customCategoryLabel.trim();

    if (!trimmedTitle) return '퀘스트 제목을 적어 주세요.';
    if (trimmedTitle.length > 80) return '제목은 80자 이하로 적어 주세요.';
    if (trimmedDescription.length > 500) return '설명은 500자 이하로 적어 주세요.';
    if (!Number.isFinite(minuteValue) || Number.isNaN(minuteValue)) return '예상 시간은 숫자로 적어 주세요.';
    if (minuteValue < 1 || minuteValue > 1440) return '예상 시간은 1분부터 1,440분 사이로 적어 주세요.';
    if (isCustom && !trimmedCustomLabel) return '나만의 퀘스트 이름을 적어 주세요.';
    return null;
  };

  const handleSubmit = async () => {
    const validationMessage = validate();
    if (validationMessage) {
      setLocalError(validationMessage);
      return;
    }

    const normalizedCategoryLabel = isCustom ? customCategoryLabel.trim() : undefined;
    const normalizedDescription = description.trim();
    const normalizedMinutes = Math.floor(minuteValue);

    if (mode === 'create') {
      await onSubmit({
        title: title.trim(),
        description: normalizedDescription || undefined,
        category,
        customCategoryLabel: normalizedCategoryLabel,
        rewardCategory: rewardCategoryFor(category),
        estimatedMinutes: normalizedMinutes,
        difficulty,
        source: 'user',
        scheduledDate: createDateKey(),
      });
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: normalizedDescription || null,
      category,
      customCategoryLabel: isCustom ? normalizedCategoryLabel : null,
      rewardCategory: rewardCategoryFor(category),
      estimatedMinutes: normalizedMinutes,
      difficulty,
    });
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>QUEST MEMO</Text>
              <Text style={styles.title}>{titleText}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons color="#6A5A4F" name="close" size={20} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <Text style={styles.label}>제목</Text>
              <TextInput
                maxLength={80}
                onChangeText={setTitle}
                placeholder="예: 책상 정리 5분 하기"
                placeholderTextColor="#B6A596"
                style={styles.input}
                value={title}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>설명</Text>
              <TextInput
                maxLength={500}
                multiline
                onChangeText={setDescription}
                placeholder="조금 더 자세한 메모를 남겨도 좋아요."
                placeholderTextColor="#B6A596"
                style={[styles.input, styles.textArea]}
                textAlignVertical="top"
                value={description}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>카테고리</Text>
              <View style={styles.chipWrap}>
                {CATEGORY_OPTIONS.map((option) => {
                  const selected = option.value === category;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      onPress={() => setCategory(option.value)}
                      style={({ pressed }) => [
                        styles.chip,
                        selected && styles.chipSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {isCustom ? (
              <View style={styles.field}>
                <Text style={styles.label}>나만의 카테고리 이름</Text>
                <TextInput
                  maxLength={40}
                  onChangeText={setCustomCategoryLabel}
                  placeholder="예: 마음 돌보기"
                  placeholderTextColor="#B6A596"
                  style={styles.input}
                  value={customCategoryLabel}
                />
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>예상 시간</Text>
              <View style={styles.minuteRow}>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={(value) => setEstimatedMinutes(value.replace(/[^0-9]/g, ''))}
                  placeholder="10"
                  placeholderTextColor="#B6A596"
                  style={[styles.input, styles.minuteInput]}
                  value={estimatedMinutes}
                />
                <Text style={styles.minuteSuffix}>분</Text>
              </View>
              <View style={styles.chipWrap}>
                {QUICK_MINUTES.map((minutes) => (
                  <Pressable
                    key={minutes}
                    accessibilityRole="button"
                    onPress={() => setEstimatedMinutes(String(minutes))}
                    style={({ pressed }) => [
                      styles.quickChip,
                      Number(estimatedMinutes) === minutes && styles.quickChipSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.quickChipText}>{minutes}분</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>난이도</Text>
              <View style={styles.chipWrap}>
                {DIFFICULTY_OPTIONS.map((option) => {
                  const selected = option.value === difficulty;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      onPress={() => setDifficulty(option.value)}
                      style={({ pressed }) => [
                        styles.chip,
                        selected && styles.chipSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {localError ? (
              <View style={styles.errorBox}>
                <Ionicons color="#AF5E5E" name="alert-circle-outline" size={16} />
                <Text style={styles.errorText}>{localError}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => void handleSubmit()}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.pressed,
                isSubmitting && styles.disabled,
              ]}
            >
              <Text style={styles.submitText}>{isSubmitting ? '붙이는 중...' : submitText}</Text>
              <Ionicons color="#FFF9EF" name="checkmark" size={18} />
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
    backgroundColor: 'rgba(54, 43, 38, 0.38)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EAD6C9',
    backgroundColor: '#FFF8EA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBDDC8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFE3EB',
  },
  kicker: {
    color: '#9B7983',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    marginTop: 4,
    color: '#3D322D',
    fontSize: 20,
    fontWeight: '900',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 249, 239, 0.78)',
  },
  form: {
    padding: 20,
    gap: 15,
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#66564B',
    fontSize: 12,
    fontWeight: '900',
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2D1BD',
    borderRadius: 17,
    color: '#3F342D',
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: '#FFFDF7',
  },
  textArea: {
    minHeight: 96,
    lineHeight: 20,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2D1BD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF7',
  },
  chipSelected: {
    borderColor: '#D48A9A',
    backgroundColor: '#FFE5EC',
  },
  chipText: {
    color: '#7D6D60',
    fontSize: 12,
    fontWeight: '900',
  },
  chipTextSelected: {
    color: '#9E5268',
  },
  minuteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minuteInput: {
    width: 100,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  minuteSuffix: {
    color: '#66564B',
    fontSize: 13,
    fontWeight: '900',
  },
  quickChip: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#EAF4FA',
  },
  quickChipSelected: {
    backgroundColor: '#CFE8F7',
  },
  quickChipText: {
    color: '#6E8798',
    fontSize: 11,
    lineHeight: 30,
    fontWeight: '900',
  },
  errorBox: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0CAC8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0EE',
  },
  errorText: {
    flex: 1,
    color: '#A15353',
    fontSize: 12,
    fontWeight: '800',
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#D48A9A',
  },
  submitText: {
    color: '#FFF9EF',
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
