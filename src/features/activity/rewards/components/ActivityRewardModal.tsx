import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ActivityCategory } from '@/features/activity/constants/activityCategory';
import { ACTIVITY_CATEGORY } from '@/features/activity/constants/activityCategory';
import type { ProcessActivityRewardResult } from '@/features/activity/rewards/types/reward';
import { theme } from '@/shared/theme';

interface ActivityRewardModalProps {
  visible: boolean;
  categoryId: ActivityCategory;
  result: ProcessActivityRewardResult | null;
  onConfirm: () => void;
}

const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  [ACTIVITY_CATEGORY.STUDY]: '공부 완료!',
  [ACTIVITY_CATEGORY.CLEANING]: '청소 완료!',
  [ACTIVITY_CATEGORY.SHOWER]: '샤워 완료!',
  [ACTIVITY_CATEGORY.WATER]: '물 마시기 완료!',
};

export function ActivityRewardModal({ visible, categoryId, result, onConfirm }: ActivityRewardModalProps) {
  const earnedXp = result?.rewardApplied ? result.earnedXp : 0;
  const earnedGrapes = result?.rewardApplied ? result.earnedGrapes : 0;
  const totalLevel = result?.newTotalLevel ?? 1;
  const categoryLevel = result?.newCategoryLevel ?? 1;
  const totalLevelUp = result?.totalLevelChange.didLevelUp ?? false;
  const categoryLevelUp = result?.categoryLevelChange.didLevelUp ?? false;

  const hasNothingRewarded = earnedXp === 0 && earnedGrapes === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm}>
      <Pressable style={styles.backdrop} onPress={onConfirm}>
        <Pressable style={styles.card} onPress={() => null}>
          <Text style={styles.title}>{CATEGORY_LABEL[categoryId]}</Text>

          {hasNothingRewarded ? (
            <Text style={styles.message}>오늘은 받을 수 있는 보상이 없어요.</Text>
          ) : (
            <>
              {earnedXp > 0 ? <Text style={styles.rewardText}>경험치 +{earnedXp}</Text> : null}
              {earnedGrapes > 0 ? <Text style={styles.rewardText}>포도 +{earnedGrapes}</Text> : null}
            </>
          )}

          <View style={styles.levelBox}>
            <Text style={styles.levelText}>
              {totalLevelUp ? `전체 레벨 Lv.${result?.totalLevelChange.previousLevel ?? 1} → Lv.${totalLevel}` : `전체 레벨 Lv.${totalLevel}`}
            </Text>
            <Text style={styles.levelText}>
              {categoryLevelUp
                ? `카테고리 레벨 Lv.${result?.categoryLevelChange.previousLevel ?? 1} → Lv.${categoryLevel}`
                : `카테고리 레벨 Lv.${categoryLevel}`}
            </Text>
          </View>

          {result?.alreadyProcessed ? <Text style={styles.notice}>이미 처리된 보상이라 다시 지급하지 않았어요.</Text> : null}

          <Pressable accessibilityRole="button" onPress={onConfirm} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>확인</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(33, 26, 18, 0.38)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 22,
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  message: {
    marginTop: 14,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
  },
  rewardText: {
    marginTop: 10,
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  levelBox: {
    marginTop: 16,
    gap: 6,
  },
  levelText: {
    color: '#6A5B4D',
    fontSize: 13,
    fontWeight: '700',
  },
  notice: {
    marginTop: 14,
    color: '#8A6D53',
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    marginTop: 20,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: '#FFF9ED',
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});

