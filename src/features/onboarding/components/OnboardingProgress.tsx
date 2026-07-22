import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ONBOARDING_STAGE_COUNT } from '@/features/onboarding/domain/onboardingState';

type OnboardingProgressProps = {
  currentStep: number;
  canGoBack?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  firstAction?: boolean;
};

export function OnboardingProgress({
  currentStep,
  canGoBack = false,
  onBack,
  onSkip,
  firstAction = false,
}: OnboardingProgressProps) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {canGoBack ? (
          <Pressable
            accessibilityLabel="이전 단계"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Ionicons color="#4B4035" name="chevron-back" size={22} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.center}>
        <Text style={styles.count}>
          {firstAction ? '첫 행동' : `${currentStep + 1} / ${ONBOARDING_STAGE_COUNT}`}
        </Text>
        {!firstAction ? (
          <View style={styles.dots}>
            {Array.from({ length: ONBOARDING_STAGE_COUNT }, (_, index) => (
              <View
                key={index}
                style={[styles.dot, index === currentStep && styles.activeDot]}
              />
            ))}
          </View>
        ) : null}
      </View>

      <View style={[styles.side, styles.rightSide]}>
        {onSkip ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSkip}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.skip}>건너뛰기</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: { width: 76, alignItems: 'flex-start' },
  rightSide: { alignItems: 'flex-end' },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 252, 245, 0.88)',
  },
  center: { alignItems: 'center' },
  count: { color: '#695C4E', fontSize: 11, fontWeight: '800' },
  dots: { marginTop: 8, flexDirection: 'row', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(89, 74, 58, 0.25)' },
  activeDot: { width: 14, backgroundColor: '#7D8963' },
  skip: { color: '#7C6E5E', fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.55 },
});
